import { Tabs, TabList, Tab } from '@chakra-ui/react'

type TabsType = 'overview' | 'treasury' | 'inv' | 'dola' | 'multisigs' | 'interest-model' | 'feds' | 'stabilizer' | 'analytics';

const tabs = [
    { page: 'overview', label: 'Overview' },
    { page: 'analytics', label: 'Analytics' },
    { page: 'treasury', label: 'Treasury' },
    { page: 'inv', label: 'INV' },
    { page: 'dola', label: 'DOLA & the Feds' },
    { page: 'feds', label: 'Feds' },
    { page: 'interest-model', label: 'Interest Rates' },
    { page: 'multisigs', label: 'Multisig Wallets' },
    { page: 'stabilizer', label: 'Stabilizer' },
]

export const TransparencyTabs = ({ active }: { active: TabsType}) => {
    const handleTab = (newIndex: number) => {
        // cleaner visually than router.push
        window.location.pathname = `/transparency/${tabs[newIndex].page}`
    }

    const activeIndex = tabs.findIndex(tab => tab.page === active);

    return (
        <Tabs onChange={handleTab} defaultIndex={activeIndex} mt="5" mb="2" overflow="auto" w="full" colorScheme="white" variant='solid-rounded'>
            <TabList justifyContent={{ base: 'flex-start', sm: 'center' }}>
                {tabs.map(tab => <Tab _focus={{outline: 'none'}} key={tab.page}>{tab.label}</Tab>)}
            </TabList>
        </Tabs>
    )
}