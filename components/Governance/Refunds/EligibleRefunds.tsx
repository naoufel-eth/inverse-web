import { useEligibleRefunds } from '@app/hooks/useDAO';
import { RefundableTransaction } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { CheckIcon, MinusIcon } from '@chakra-ui/icons';
import { Box, Checkbox, Divider, Flex, HStack, Stack, Switch, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useEffect, useState } from 'react';
import { Timestamp } from '../../common/BlockTimestamp/Timestamp';
import { SubmitButton } from '../../common/Button';
import Container from '../../common/Container';
import { InfoMessage } from '../../common/Messages';
import ScannerLink from '../../common/ScannerLink';
import { SkeletonBlob } from '../../common/Skeleton';
import Table from '../../common/Table';
import { RefundsModal } from './RefundModal';

export const EligibleRefunds = () => {
    const { account, library } = useWeb3React<Web3Provider>();
    const { transactions: items, isLoading } = useEligibleRefunds();
    const [eligibleTxs, setEligibleTxs] = useState<RefundableTransaction[]>([]);
    const [filteredTxs, setFilteredTxs] = useState<RefundableTransaction[]>([]);
    const [txsToRefund, setTxsToRefund] = useState<RefundableTransaction[]>([]);
    const [checkedTxs, setCheckedTxs] = useState<string[]>([]);
    const [hideAlreadyRefunded, setHideAlreadyRefunded] = useState(true);
    const { isOpen, onClose, onOpen } = useDisclosure();

    useEffect(() => {
        setFilteredTxs(hideAlreadyRefunded ? eligibleTxs.filter(t => !t.refunded) : eligibleTxs);
    }, [hideAlreadyRefunded, eligibleTxs])

    useEffect(() => {
        if (checkedTxs.length > 0 || eligibleTxs.length > 0) { return }
        setEligibleTxs(items)
    }, [items, checkedTxs, eligibleTxs]);

    useEffect(() => {
        setEligibleTxs(eligibleTxs.map(t => ({ ...t, checked: checkedTxs.includes(t.txHash) })));
    }, [checkedTxs])

    const handleCheckTx = (txHash: string) => {
        if (checkedTxs.includes(txHash)) {
            setCheckedTxs(checkedTxs.filter(h => txHash !== h));
        } else {
            setCheckedTxs([...checkedTxs, txHash])
        }
    }

    const columns = [
        {
            field: 'txHash',
            label: 'TX',
            header: ({ ...props }) => <Flex justify="flex-start" minWidth={'110px'} {...props} />,
            value: ({ txHash, chainId }) => <Flex justify="flex-start" minWidth={'110px'}>
                <ScannerLink type="tx" value={txHash} chainId={chainId} />
            </Flex>,
        },
        {
            field: 'timestamp',
            label: 'Date',
            header: ({ ...props }) => <Flex justify="center" minW={'120px'} {...props} />,
            value: ({ timestamp }) => <Flex justify="center" minW={'120px'}>
                <Timestamp timestamp={timestamp} />
            </Flex>,
        },
        {
            field: 'fees',
            label: 'Paid Fees',
            header: ({ ...props }) => <Flex justify="flex-end" minWidth={'100px'} {...props} />,
            value: ({ fees }) => <Flex justify="flex-end" minWidth={'100px'} alignItems="center">
                <Text mr="1">~{shortenNumber(parseFloat(fees), 5)}</Text>
                {/* <AnimatedInfoTooltip message={fees} /> */}
            </Flex>,
        },
        {
            field: 'name',
            label: 'Action',
            header: ({ ...props }) => <Flex justify="flex-end" minWidth={'180px'} {...props} />,
            value: ({ name, call }) => <Flex justify="flex-end" minWidth={'180px'} alignItems="center">
                {name}
            </Flex>,
        },
        {
            field: 'from',
            label: 'From',
            header: ({ ...props }) => <Flex justify="center" minWidth={'120px'} {...props} />,
            value: ({ from, chainId }) => <Flex justify="center" minWidth={'120px'}>
                <ScannerLink value={from} chainId={chainId} />
            </Flex>,
        },
        {
            field: 'to',
            label: 'Contract',
            header: ({ ...props }) => <Flex justify="center" minWidth={'200px'} {...props} />,
            value: ({ to, chainId }) => <Flex justify="center" minWidth={'200px'}>
                <ScannerLink value={to} chainId={chainId} />
            </Flex>,
        },
        // {
        //     field: 'successful',
        //     label: 'Tx Success?',
        //     header: ({ ...props }) => <Flex justify="center" minWidth={'80px'} {...props} />,
        //     value: ({ successful }) => <Flex justify="center" minWidth={'80px'}>
        //         {successful ? 'yes' : 'no'}
        //     </Flex>,
        // },
        {
            field: 'refunded',
            label: 'Refunded?',
            header: ({ ...props }) => <Flex justify="center" minWidth={'120px'} {...props} />,
            value: ({ refunded, refundTxHash, chainId }) => <Flex justify="center" minWidth={'120px'}>
                {
                    refunded ?
                        <VStack>
                            <CheckIcon color="secondary" />
                            <ScannerLink value={refundTxHash} type="tx" chainId={chainId} />
                        </VStack>
                        :
                        <MinusIcon />
                }
            </Flex>,
        },
        {
            field: 'checked',
            label: '#',
            header: ({ ...props }) => <Flex justify="center" minWidth={'80px'} {...props} />,
            value: ({ txHash, checked, refunded }) => <Flex justify="center" minWidth={'80px'} position="relative" onClick={() => handleCheckTx(txHash)}>
                <Box position="absolute" top="0" bottom="0" left="0" right="0" maring="auto" zIndex="1"></Box>
                {
                    !refunded && <Checkbox value="true" isChecked={checked} />
                }
            </Flex>
        },
    ];

    const handleRefund = (eligibleTxs, checkedTxs) => {
        if (!library?.getSigner()) { return }
        const items = eligibleTxs.filter(t => checkedTxs.includes(t.txHash));
        setTxsToRefund(items);
        onOpen();
    }

    const handleSuccess = ({ refunds, signedBy, signedAt, refundTxHash }) => {
        const refundsTxHashes = refunds.map(r => r.txHash);
        const updatedItems = [...eligibleTxs];
        eligibleTxs.forEach((et, i) => {
            if (refundsTxHashes.includes(et.txHash)) {
                const isRefunded = !!refundTxHash;
                updatedItems[i] = { ...et, refundTxHash: refundTxHash, refunded: isRefunded, signedBy, signedAt }
            }
        })
        setEligibleTxs(updatedItems)
        setCheckedTxs([]);
        onClose();
    }

    return (
        <Container
            label="Potentially Eligible Transactions for Gas Refunds"
            description="Taken into consideration: GovMills txs (VoteCasting: only for delegates) and Multisig txs"
            noPadding
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
            collapsable={true}
            right={
                !account ?
                    <InfoMessage alertProps={{ fontSize: '12px' }} description="Please Connect Wallet" />
                    :
                    <InfoMessage alertProps={{ fontSize: '12px', w: '500px' }} description="Check at least one Transaction" />
            }
        >
            {
                isLoading ?
                    <SkeletonBlob />
                    :
                    filteredTxs.length > 0 ?
                        <VStack spacing="4" w='full' alignItems="space-between">
                            <RefundsModal isOpen={isOpen} txs={txsToRefund} onClose={onClose} onSuccess={handleSuccess} />
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems={{ base: 'flex-end', xl: 'center' }}>
                                <HStack alignItems="center">
                                    <Text cursor="pointer" color={'secondaryTextColor'} onClick={() => setHideAlreadyRefunded(!hideAlreadyRefunded)}>Hide Already Refunded Txs?</Text>
                                    <Switch isChecked={hideAlreadyRefunded} onChange={() => setHideAlreadyRefunded(!hideAlreadyRefunded)} />
                                </HStack>
                                <HStack>
                                    {/* <SubmitButton
                                        disabled={!checkedTxs.length || !account}
                                        w="240px"
                                        onClick={() => handleRefund(eligibleTxs, checkedTxs, refundTxHash)}>
                                        UNMARK AS REFUNDED
                                    </SubmitButton> */}
                                    <SubmitButton
                                        disabled={!checkedTxs.length || !account}
                                        w="240px"
                                        onClick={() => handleRefund(eligibleTxs, checkedTxs)}>
                                        Refund {checkedTxs.length} Txs
                                    </SubmitButton>
                                </HStack>
                            </Stack>
                            <Divider />
                            <Table
                                columns={columns}
                                items={filteredTxs}
                                keyName={'txHash'}
                                defaultSort="timestamp"
                                defaultSortDir="desc"
                                maxH="calc(100vh - 400px)"
                            />
                        </VStack>
                        :
                        <Text>No Result</Text>
            }
        </Container>
    )
}