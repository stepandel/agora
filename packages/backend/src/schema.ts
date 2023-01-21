import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  extractFirstParagraph,
  getTitleFromProposalDescription,
  trimENSStatementHeader,
} from "./utils/markdown";
import { GraphQLScalarType } from "graphql";
import { BigNumber, ethers } from "ethers";
import { ProposalStatus, Resolvers } from "./generated/types";
import { formSchema } from "./formSchema";
import { Proposal, StoredStatement } from "./model";
import schema from "./schema.graphql";
import { marked } from "marked";
import { validateSigned } from "./utils/signing";
import { resolveNameFromAddress } from "./utils/resolveName";
import { Snapshot } from "./snapshot";
import { attachTracingContextInjection } from "./graphql/tracingContext";
import { applyIdPrefix } from "./graphql/applyIdPrefix";

// todo: fix everything in here
// todo: __typename
// todo: overviewmetricscontainer
// todo: decompose this file
// todo: move all reads to dynamodb
// todo: update snapshot

export function makeGatewaySchema() {
  const amountSpec = {
    currency: "OP",
    decimals: 18,
  };

  function getTotalSupply(snapshot: Snapshot) {
    return snapshot.GovernanceToken.totalSupply;
  }

  function getQuorum(snapshot: Snapshot) {
    const totalSupply = getTotalSupply(snapshot);

    return totalSupply.mul(3000).div(10000);
  }

  function bpsOf(top: BigNumber, bottom: BigNumber) {
    return Math.round(
      top
        .mul(100 * 100)
        .div(bottom)
        .toNumber()
    );
  }

  function proposedByAddress(address: string, snapshot: Snapshot) {
    // todo:
    return [];
    // return Array.from(snapshot.ENSGovernor.proposals.values()).filter(
    //   (prop) => prop.proposer.toLowerCase() === address
    // );
  }

  function votesByAddress(address: string, snapshot: Snapshot) {
    // todo:
    return [];
    // return snapshot.ENSGovernor.votes.filter(
    //   (vote) => vote.voter.toLowerCase() === address
    // );
  }

  function getVotesForProposal(proposalId: BigNumber, snapshot: Snapshot) {
    // todo:
    return [];
    // return snapshot.ENSGovernor.votes.filter((vote) =>
    //   vote.proposalId.eq(proposalId)
    // );
  }

  function recentCompletedProposals(snapshot: Snapshot) {
    // todo:
    return [];
    // return Array.from(snapshot.ENSGovernor.proposals.values())
    //   .filter((it) => ["EXECUTED", "QUEUED"].includes(it.status.type))
    //   .sort(bigNumberDescendingComparator((it) => it.startBlock));
  }

  const typedResolvers: Resolvers = {
    BigInt: new GraphQLScalarType({
      name: "BigInt",
      serialize(value: ethers.BigNumber) {
        return value.toString();
      },
      parseValue(value) {
        return ethers.BigNumber.from(value);
      },
    }),
    Timestamp: new GraphQLScalarType({
      name: "Timestamp",
      serialize(value: Date) {
        return +value;
      },
      parseValue(value: number) {
        new Date(value);
      },
    }),

    Query: {
      async delegate(_, { addressOrEnsName }, { provider, delegateStorage }) {
        const address = await provider.resolveName(addressOrEnsName);
        if (!address) {
          return null;
        }

        const delegate = await delegateStorage.getDelegate(address);
        if (!delegate) {
          return {
            address,
            tokensOwned: BigNumber.from(0),
            tokensRepresented: BigNumber.from(0),
            tokenHoldersRepresented: 0,
            statement: null,
          };
        }
        return delegate;
      },

      async delegates(
        _,
        { where, orderBy, first, after },
        { delegateStorage }
      ) {
        return await delegateStorage.getDelegates({
          first,
          after,
          orderBy,
          where,
        });
      },

      async proposal() {
        return proposal;
      },

      proposals(_, _args, { snapshot }) {
        return [proposal];
        // return Array.from(snapshot.ENSGovernor.proposals.values());
      },

      metrics() {
        return {};
      },
    },

    Metrics: {
      proposalThreshold() {
        return ethers.BigNumber.from("100000000000000000000000");
      },
      delegatedSupply(_parent, _args, { snapshot }) {
        const delegatedSupply = snapshot.GovernanceToken.delegatedSupply;

        return {
          amount: delegatedSupply,
          ...amountSpec,
        };
      },
      totalSupply(_parent, _args, { snapshot }) {
        return {
          amount: getTotalSupply(snapshot),
          ...amountSpec,
        };
      },
      quorum(_parent, _args, { snapshot }) {
        return getQuorum(snapshot);
      },
    },

    Address: {
      isContract: {
        async resolve({ address }, _args, { provider }) {
          const code = await provider.getCode(address);
          const parsedCode = ethers.utils.arrayify(code);
          return !!parsedCode.length;
        },
      },

      resolvedName: {
        resolve(address) {
          return address;
        },
      },
    },

    ResolvedName: {
      async name({ address, resolvedName }, _args, { provider }) {
        if (typeof resolvedName !== "undefined") {
          return resolvedName;
        }

        return await resolveNameFromAddress(address, provider);
      },

      address({ address }) {
        return address;
      },
    },

    Delegate: {
      id({ address }) {
        return `Delegate|${address}`;
      },

      address({ address, resolvedName }) {
        return {
          address,
          resolvedName,
        };
      },

      statement({ address, statement }, _args) {
        if (!statement) {
          return null;
        }

        const values = formSchema.parse(JSON.parse(statement.signedPayload));
        return {
          address,
          values,
        };
      },

      amountOwned({ tokensOwned }) {
        return tokensOwned;
      },

      tokensRepresented({ tokensRepresented }) {
        return tokensRepresented;
      },

      delegateMetrics(
        { address, tokenHoldersRepresented },
        _args,
        { snapshot }
      ) {
        const votes = votesByAddress(address, snapshot);
        const lastTenProps = new Set(
          recentCompletedProposals(snapshot)
            .slice(0, 10)
            .map((it) => it.id.toString())
        );

        // todo: implement
        return {
          tokenHoldersRepresentedCount: tokenHoldersRepresented,
          totalVotes: votes.length,
          forVotes: votes.filter((vote) => vote.support === 1).length,
          againstVotes: votes.filter((vote) => vote.support === 0).length,
          abstainVotes: votes.filter((vote) => vote.support === 2).length,
          ofLastTenProps: votes.filter((vote) =>
            lastTenProps.has(vote.proposalId.toString())
          ).length,
          // todo: fix me
          ofTotalProps: Math.floor((votes.length / 10) * 100),
          proposalsCreated: proposedByAddress(address, snapshot).length,
        };
      },

      proposed({ address }, _args, { snapshot }) {
        return proposedByAddress(address, snapshot);
      },

      votes({ address }, _args, { snapshot }) {
        return votesByAddress(address, snapshot);
      },

      async snapshotVotes({ address }, _args, { snapshotVoteStorage }) {
        return await snapshotVoteStorage.getSnapshotVotesByVoter(address);
      },
    },

    SnapshotVote: {
      id({ id }) {
        return id;
      },
      createdAt({ created }) {
        return new Date(created * 1000);
      },
      proposal({ proposal }, _args) {
        return proposal;
      },
      reason({ reason }) {
        return reason;
      },
      votingPower({ vp }) {
        return vp;
      },
      choice(vote) {
        return vote;
      },
    },

    SnapshotVoteChoice: {
      __resolveType({ proposal }) {
        switch (proposal.type) {
          case "basic":
          case "single-choice":
            return "SnapshotVoteChoiceSingle";

          case "ranked-choice":
            return "SnapshotVoteChoiceRanked";
          case "quadratic":
            return "SnapshotVoteChoiceQuadratic";

          case "approval":
            return "SnapshotVoteChoiceApproval";
          case "weighted":
            return "SnapshotVoteChoiceWeighted";
        }
      },
    },

    SnapshotVoteChoiceApproval: {
      approvedChoices({ choice }) {
        return choice;
      },
    },

    SnapshotVoteChoiceSingle: {
      selectedChoiceIdx({ choice }) {
        return choice;
      },
    },

    SnapshotVoteChoiceRanked: {
      choices({ choice }) {
        return choice;
      },
    },

    SnapshotVoteChoiceQuadratic: {
      // @ts-ignore
      weights({ choice }) {
        return Object.entries(choice).map(([choiceIdx, weight]) => ({
          choiceIdx: Number(choiceIdx),
          weight,
        }));
      },
    },

    SnapshotVoteChoiceWeighted: {
      // @ts-ignore
      weights({ choice }) {
        return Object.entries(choice).map(([choiceIdx, weight]) => ({
          choiceIdx: Number(choiceIdx),
          weight,
        }));
      },
    },

    SnapshotProposal: {
      id({ id }) {
        return id;
      },
      title({ title }) {
        return title;
      },
      link({ link }) {
        return link;
      },
      choices({ choices, scores }) {
        return choices.map((choice, idx) => ({
          title: choice,
          score: scores[idx],
        }));
      },
    },

    Vote: {
      id({ transactionHash }) {
        return `Vote|${transactionHash}`;
      },

      proposal({ proposalId }, _args, { snapshot }) {
        // todo:
        return null;
        // return snapshot.ENSGovernor.proposals.get(proposalId.toString());
      },

      reason({ reason }) {
        return reason;
      },

      supportDetailed({ support }) {
        return support;
      },

      transaction({ blockHash, transactionHash }) {
        return { blockHash, transactionHash };
      },

      votes({ weight }) {
        return weight;
      },
    },

    Proposal: {
      id({ id }) {
        return `Proposal|${id.toString()}`;
      },

      async proposer({ proposer }, _args, { delegateStorage }) {
        return await delegateStorage.getDelegate(proposer);
      },

      number({ id }) {
        return id;
      },

      votes({ id }, _args, { snapshot }) {
        return getVotesForProposal(id, snapshot);
      },

      forVotes({ id }) {
        // todo: implement
        return BigNumber.from(0);
      },

      againstVotes() {
        // todo: implement
        return BigNumber.from(0);
      },

      abstainVotes() {
        // todo: implement
        return BigNumber.from(0);
      },

      voteStartsAt() {
        return 0;
      },

      voteEndsAt() {
        return 0;
      },

      quorumVotes() {
        return BigNumber.from(0);
      },

      totalValue({ values }) {
        return values.reduce((acc, value) => acc.add(value), BigNumber.from(0));
      },

      title({ description }) {
        return getTitleFromProposalDescription(description);
      },

      totalVotes({ id }, _args, { snapshot }) {
        const votes = getVotesForProposal(id, snapshot);
        return votes.reduce(
          (acc, vote) => acc.add(vote.weight),
          BigNumber.from(0)
        );
      },

      status({ status }) {
        // todo: implement
        switch (status.type) {
          default:
            return ProposalStatus.Cancelled;
        }
      },
    },

    Transaction: {
      id({ transactionHash }) {
        return `Transaction:${transactionHash}`;
      },

      hash({ transactionHash }) {
        return transactionHash;
      },

      async block({ blockHash }, _args, { provider }) {
        return await provider.getBlock(blockHash);
      },
    },

    Block: {
      id({ hash }) {
        return `Block:${hash}`;
      },

      number({ number }) {
        return BigNumber.from(number);
      },

      timestamp({ timestamp }) {
        return new Date(timestamp * 1000);
      },
    },

    // todo: some of this stuff is in state
    VotingPower: {
      amount(value) {
        return {
          amount: value,
          ...amountSpec,
        };
      },

      bpsOfTotal(value, _args, { snapshot }) {
        const totalSupply = getTotalSupply(snapshot);
        return bpsOf(value, totalSupply);
      },

      bpsOfQuorum(value, _args, { snapshot }) {
        const quorum = getQuorum(snapshot);
        return bpsOf(value, quorum);
      },
    },

    DelegateStatement: {
      summary({ values: { delegateStatement } }) {
        return extractFirstParagraph(
          marked.lexer(trimENSStatementHeader(delegateStatement.slice(0, 1000)))
        );
      },

      statement({ values: { delegateStatement } }) {
        return delegateStatement;
      },

      topIssues({ values: { topIssues } }) {
        return topIssues as any;
      },

      async leastValuableProposals(
        { values: { leastValuableProposals } },
        args,
        context,
        info
      ) {
        // todo: implement
        return [];
      },

      async mostValuableProposals(
        { values: { mostValuableProposals } },
        args,
        context,
        info
      ) {
        // todo: implement
        return [];
      },

      discord({ values: { discord } }) {
        return discord;
      },

      twitter({ values: { twitter } }) {
        return twitter;
      },

      openToSponsoringProposals({ values: { openToSponsoringProposals } }) {
        switch (openToSponsoringProposals) {
          case "yes":
            return true;

          case "no":
            return false;

          default:
            return null;
        }
      },
    },

    Mutation: {
      async createNewDelegateStatement(
        parent,
        args,
        { statementStorage, emailStorage, delegateStorage, provider },
        info
      ) {
        const updatedAt = Date.now();
        const validated = await validateSigned(provider, args.data.statement);

        const nextStatement: StoredStatement = {
          address: validated.address,
          signedPayload: validated.value,
          signature: validated.signature,
          signatureType: validated.signatureType,
          updatedAt,
        };

        const delegate = await delegateStorage.getDelegate(validated.address);

        await statementStorage.addStatement(nextStatement);

        if (args.data.email) {
          await emailStorage.addEmail(
            await validateSigned(provider, args.data.email)
          );
        }

        return { ...delegate, statement: nextStatement };
      },
    },
  };

  const resolvers = typedResolvers;

  return attachTracingContextInjection(
    applyIdPrefix(
      makeExecutableSchema({
        typeDefs: schema,

        resolvers,
      })
    )
  );
}

const proposal: Proposal = {
  id: BigNumber.from(1),
  proposer: "0x5e349eca2dc61abcd9dd99ce94d04136151a09ee",
  calldatas: [],
  signatures: [],
  values: [],
  targets: [],
  description:
    "# Badgeholder Nomination Voting\nAs part of the recently announced [retroPGF 2](https://optimism.mirror.xyz/wqk1Yeyn2OhV9paDzbRXvQ0m0JYDu2npbSkMClwk1rY) , voting badges will be distributed to a set of 90 community members. One voting badge will be given to 10 Token House delegates. Below are all valid nominations (please see [the original post](https://gov.optimism.io/t/token-house-badgeholder-nominations/4196/12) and [Token House Badgeholder Election Information](https://gov.optimism.io/t/token-house-badgeholder-election-information/4195)  for more information.)",
  endBlock: BigNumber.from(100),
  startBlock: BigNumber.from(0),
  status: {
    type: "CANCELLED",
  },
};
