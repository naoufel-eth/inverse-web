import { useState } from 'react';
import { InfoMessage } from '@inverse/components/common/Messages';
import { ProposalForm } from './ProposalForm';
import { Box, Text } from '@chakra-ui/react';
import Link from '@inverse/components/common/Link';
import { TEST_IDS } from '@inverse/config/test-ids';
import { GovEra, NetworkIds } from '@inverse/types';
import { useEffect } from 'react';
import { getGovernanceContract } from '@inverse/util/contracts';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { formatUnits } from 'ethers/lib/utils';
import ScannerLink from '@inverse/components/common/ScannerLink';
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { useRouter } from 'next/dist/client/router';

const DEFAULT_REQUIRED_VOTING_POWER = 1000;
const { GOVERNANCE } = getNetworkConfigConstants(NetworkIds.mainnet)

export const ProposalFormContainer = ({ votingPower }: { votingPower: number }) => {
    const { library, account } = useWeb3React<Web3Provider>();
    const [requiredVotingPower, setRequiredVotingPower] = useState(DEFAULT_REQUIRED_VOTING_POWER);
    const [lastProposalId, setLastProposalId] = useState(0);
    const { query } = useRouter();

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (!account) { return }
            const govContract = getGovernanceContract(library?.getSigner(), GovEra.mills);
            const threshold = await govContract.proposalThreshold();
            const lastId = await govContract.proposalCount();
            if (!isMounted) { return }
            const parsedThreshold = parseFloat(formatUnits(threshold));
            setRequiredVotingPower(parsedThreshold)
            setLastProposalId(parseInt(lastId))
        }
        init();
        return () => { isMounted = false }
    }, [library])

    const { proposalLinkData, isPreview } = (query || {})
    const { title = '', description = '', functions = [], draftId = undefined } = (proposalLinkData ? JSON.parse(proposalLinkData as string) : {})

    return (
        <Box w="full" p={6} pb={0} data-testid={TEST_IDS.governance.newProposalContainer}>
            <Text textAlign="center" fontSize="30px" fontWeight="bold">
                Add a New Proposal
            </Text>
            <Text textAlign="center" fontSize="12px" mb="7">
                (Governance Contract : <ScannerLink value={GOVERNANCE} shorten={true} />)
            </Text>
            {
                !proposalLinkData && (votingPower < requiredVotingPower || !account) ?
                    <Box w="full" textAlign="center">
                        <InfoMessage
                            alertProps={{ textAlign: "center", p: '6' }}
                            description={
                                <>
                                    At least <b>1000 voting power</b> is required to make a new proposal.
                                </>
                            } />
                        <Text mt="3">
                            You can share your proposal idea in our
                            <Link fontWeight="bold" ml="1" href="https://discord.gg/YpYJC7R5nv" isExternal>
                                Discord
                            </Link>
                        </Text>
                        {
                            account && <Text mt="3" fontSize="12px">
                                If you're interested in seeing how the proposal creation works or want to create a local draft please follow this
                                <Link
                                    ml="1"
                                    display="inline-block"
                                    href={{
                                        pathname: `/governance/propose`,
                                        query: { proposalLinkData: JSON.stringify({title: 'Draft', description: 'Draft content', actions:[] }) }
                                    }}>
                                    link
                                </Link>
                            </Text>
                        }
                    </Box>
                    :
                    <Box w="full" textAlign="center">
                        <ProposalForm isPreview={isPreview === 'true'} lastProposalId={lastProposalId} title={title as string} description={description as string} functions={functions} draftId={draftId} />
                    </Box>
            }
        </Box>
    )
}