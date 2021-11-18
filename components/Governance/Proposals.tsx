import { Flex, Stack } from '@chakra-ui/react'
import Container from '@inverse/components/common/Container'
import { ProposalPreview } from '@inverse/components/Governance/Proposal'
import { SkeletonBlob } from '@inverse/components/common/Skeleton'
import { useProposals } from '@inverse/hooks/useProposals'
import { Proposal, ProposalStatus } from '@inverse/types'
import NextLink from 'next/link'

export const Proposals = () => {
  const { proposals, isLoading } = useProposals()

  if (isLoading) {
    return (
      <Container
        label="Governance Proposals"
        description="Participate in governance of the DAO"
        href="https://docs.inverse.finance/governance"
      >
        <SkeletonBlob skeletonHeight={16} noOfLines={4} />
      </Container>
    )
  }

  return (
    <Container
      label="Governance Proposals"
      description="Participate in governance of the DAO"
      href="https://docs.inverse.finance/governance"
    >
      <Stack w="full" spacing={1}>
        {proposals
          .sort((a: Proposal, b: Proposal) => b.proposalNum - a.proposalNum)
          .map((proposal: Proposal) => (
            <ProposalPreview key={proposal.proposalNum} proposal={proposal} />
          ))}
      </Stack>
    </Container>
  )
}

export const ActiveProposals = () => {
  const { proposals } = useProposals()

  const active = proposals
    ?.filter((proposal: Proposal) => proposal.status === ProposalStatus.active)
    .sort((a: Proposal, b: Proposal) => b.proposalNum - a.proposalNum)

  return (
    <Container
      label="Active Proposals"
      description="Participate in governance of the DAO"
      href="https://docs.inverse.finance/governance"
    >
      <Stack w="full" spacing={1}>
        {active?.length ? (
          active.map((proposal: Proposal) => <ProposalPreview key={proposal.proposalNum} proposal={proposal} />)
        ) : (
          <Flex w="full" justify="center" color="purple.200" fontSize="sm">
            There are no active proposals.
          </Flex>
        )}
      </Stack>
    </Container>
  )
}

export const RecentProposals = () => {
  const { proposals, isLoading } = useProposals()

  if (isLoading) {
    return (
      <Container label="Recent Proposals">
        <SkeletonBlob skeletonHeight={16} noOfLines={4} />
      </Container>
    )
  }

  const recent = proposals
    ?.filter((proposal: Proposal) => proposal.status !== ProposalStatus.active)
    .sort((a: Proposal, b: Proposal) => b.proposalNum - a.proposalNum)
    .slice(0, 10)

  return (
    <Container label="Recent Proposals">
      <Stack w="full" spacing={1}>
        {recent.map((proposal: Proposal) => (
          <ProposalPreview key={proposal.proposalNum} proposal={proposal} />
        ))}
        <NextLink href="/governance/proposals">
          <Flex
            cursor="pointer"
            w="full"
            p={2}
            justify="center"
            fontSize="xs"
            fontWeight="semibold"
            borderRadius={8}
            textTransform="uppercase"
            color="purple.100"
            _hover={{ bgColor: 'purple.850' }}
          >
            View All
          </Flex>
        </NextLink>
      </Stack>
    </Container>
  )
}
