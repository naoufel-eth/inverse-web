import { Flex, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { DolaFlowChart } from '@app/components/Transparency/DolaFlowChart'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO } from '@app/hooks/useDAO'
import { SupplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos'

const { DOLA, TOKENS, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);


export const DolaDiagram = () => {
  const { dolaTotalSupply, dolaOperator, fantom, feds, optimism } = useDAO();

  const fedsWithData = feds;

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Dola</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="Dola & the Feds" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-feds.png" />
        <meta name="description" content="Dola & the Feds" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, dola, fed, expansion, contraction, supply" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="DOLA & the Feds" />
      <TransparencyTabs active="dola" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }} ml="2">
        <Flex direction="column" py="2">
          <DolaFlowChart dola={DOLA} dolaOperator={dolaOperator || TREASURY} feds={fedsWithData} />
        </Flex>
        <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
          <DolaMoreInfos />
          <SupplyInfos token={TOKENS[DOLA]} supplies={[
            { chainId: NetworkIds.mainnet, supply: dolaTotalSupply - fantom?.dolaTotalSupply - optimism?.dolaTotalSupply},
            { chainId: NetworkIds.ftm, supply: fantom?.dolaTotalSupply },
            { chainId: NetworkIds.optimism, supply: optimism?.dolaTotalSupply },
          ]}
          />
          <SupplyInfos
            title="🦅&nbsp;&nbsp;DOLA Fed Supplies"
            supplies={fedsWithData}
          />
          <ShrinkableInfoMessage
            title="⚡&nbsp;&nbsp;Roles & Powers"
            description={
              <>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Dola operator:</Text>
                  <Text>Add/remove DOLA minters</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Fed Chair:</Text>
                  <Text>Resize the amount of DOLA supplied</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Fed Gov:</Text>
                  <Text>Change the Fed Chair</Text>
                </Flex>
              </>
            }
          />
        </VStack>
      </Flex>
    </Layout>
  )
}

export default DolaDiagram
