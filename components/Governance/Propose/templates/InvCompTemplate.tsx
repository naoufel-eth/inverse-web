import { useState } from 'react'
import { FormControl, FormLabel, VStack } from '@chakra-ui/react'
import { Input } from '@inverse/components/common/Input'
import { AddressAutocomplete } from '@inverse/components/common/Input/AddressAutocomplete'
import ScannerLink from '@inverse/components/common/ScannerLink'
import { isAddress } from 'ethers/lib/utils'
import { SubmitButton } from '@inverse/components/common/Button'
import { useEffect } from 'react';
import { AutocompleteItem, NetworkIds, TemplateProposalFormActionFields } from '@inverse/types'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { parseUnits } from '@ethersproject/units';

const { INV, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

export const InvCompTemplate = ({
    defaultAddress = '',
    defaultAmount = '',
    onSubmit,
}: {
    defaultAddress?: string,
    defaultAmount?: string,
    onSubmit: (action: TemplateProposalFormActionFields) => void,
}) => {
    const [destination, setDestination] = useState(defaultAddress);
    const [amount, setAmount] = useState(defaultAmount);
    const [isDisabled, setIsDisabled] = useState(true);

    useEffect(() => {
        setIsDisabled(!amount || amount === '0' || !destination || !isAddress(destination))
    }, [amount, destination])

    const handleAmountChange = (e: any) => {
        setAmount(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))
    }

    const handleAddressChange = (item: AutocompleteItem | undefined) => {
        setDestination(item?.value || '')
    }

    const handleSubmit = () => {
        const action: TemplateProposalFormActionFields = {
            contractAddress: INV,
            func: 'transfer(address destination, uint256 rawAmount)',
            args: [
                { type: 'address', value: destination, name: 'destination' },
                { type: 'uint256', value: parseUnits(amount, TOKENS[INV].decimals), name: 'rawAmount' },
            ],
            value: '0',
        }
        onSubmit(action)
    }

    return (
        <VStack spacing="2">
            <FormControl>
                <FormLabel>
                    Destination Address :
                    {
                        defaultAddress && isAddress(defaultAddress) ?
                            <ScannerLink value={defaultAddress} shorten={true} /> : null
                    }
                </FormLabel>
                <AddressAutocomplete
                    defaultValue={defaultAddress}
                    onItemSelect={handleAddressChange}
                />
            </FormControl>
            <FormControl>
                <FormLabel>
                    Amount in INV :
                </FormLabel>
                <Input type="number" min="0" defaultValue={defaultAmount} onChange={handleAmountChange} />
            </FormControl>
            <SubmitButton isDisabled={isDisabled} bgColor="secondary" onClick={handleSubmit}>
                ADD ACTION
            </SubmitButton>
        </VStack>
    )
}