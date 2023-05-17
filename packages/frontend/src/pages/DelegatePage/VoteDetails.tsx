import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoteDetailsFragment$key } from "./__generated__/VoteDetailsFragment.graphql";
import { VStack } from "../../components/VStack";
import {
  colorForSupportType,
  toSupportType,
  ValuePart,
  VoteDetailsContainer,
  VoteTitle,
} from "./VoteDetailsContainer";
import { pluralizeVote } from "../../words";
import { BigNumber } from "ethers";
import { formatDistanceToNow } from "date-fns";
import { VoteReason } from "../../components/VoteReason";

type Props = {
  voteFragment: VoteDetailsFragment$key;
};

export function VoteDetails({ voteFragment }: Props) {
  const vote = useFragment(
    graphql`
      fragment VoteDetailsFragment on Vote {
        reason
        ...VoteReasonFragment
        supportDetailed
        votes {
          amount {
            amount
            decimals
          }
        }
        transaction {
          timestamp
        }
        options {
          description
        }

        proposal {
          number
          title

          totalValue

          proposalData {
            __typename
          }
        }
      }
    `,
    voteFragment
  );

  const proposalHref = `https://www.tally.xyz/governance/eip155:1:0x323A76393544d5ecca80cd6ef2A560C6a395b7E3/proposal/${vote.proposal.number}`;

  const supportType = toSupportType(
    vote.supportDetailed,
    vote.proposal.proposalData.__typename === "StandardProposalData"
  );

  // This is a hack to hide a proposal formatting mistake from the OP Foundation
  const proposalsWithBadFormatting = [
    "114732572201709734114347859370226754519763657304898989580338326275038680037913",
    "27878184270712708211495755831534918916136653803154031118511283847257927730426",
    "90839767999322802375479087567202389126141447078032129455920633707568400402209",
  ];

  // This is a hack to hide a proposal formatting mistake from the OP Foundation
  const shortTitle = proposalsWithBadFormatting.includes(vote.proposal.number)
    ? vote.proposal.title.split("-")[0].split("(")[0]
    : vote.proposal.title;

  return (
    <VoteDetailsContainer>
      <div
        className={css`
          display: grid;
          overflow-y: hidden;
          grid-template-columns: 1fr 1px 1fr;

          @media (max-width: ${theme.maxWidth["2xl"]}) {
            grid-template-rows: 1fr;
            grid-template-columns: none;
            overflow-y: scroll;
          }
        `}
      >
        <VStack
          className={css`
            padding: ${theme.spacing["4"]} ${theme.spacing["6"]};
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
              color: #66676b;
            `}
          >
            <a href={proposalHref} title={`Prop ${vote.proposal.number}`}>
              Prop {shortenId(vote.proposal.number)}
            </a>
            <ValuePart value={vote.proposal.totalValue} />
            {vote.transaction.timestamp &&
              ` - ${formatDistanceToNow(
                new Date(vote.transaction.timestamp)
              )} ago`}
          </div>

          <VoteTitle>
            <a href={proposalHref}>{shortTitle}</a>
          </VoteTitle>

          {vote.proposal.proposalData.__typename ===
            "ApprovalVotingProposalData" && (
            <div
              className={css`
                font-size: ${theme.fontSize.xs};
                font-weight: ${theme.fontWeight.medium};
                color: #66676b;
              `}
            >
              Voted :{" "}
              {vote.options?.map((option, i) => (
                <>
                  {option.description}
                  {/* add a coma here if not last option */}
                  {i !== vote.options!.length - 1 && ", "}
                </>
              ))}
              {vote.options?.length === 0 && "Abstain"}
              <span
                className={css`
                  color: ${colorForSupportType(supportType)};
                  font-size: ${theme.fontSize.xs};
                  font-weight: ${theme.fontWeight.medium};
                `}
              >
                {" "}
                with{" "}
                {pluralizeVote(
                  BigNumber.from(vote.votes.amount.amount),
                  vote.votes.amount.decimals
                )}
              </span>
            </div>
          )}

          {vote.proposal.proposalData.__typename === "StandardProposalData" && (
            <span
              className={css`
                color: ${colorForSupportType(supportType)};
                font-size: ${theme.fontSize.xs};
                font-weight: ${theme.fontWeight.medium};
              `}
            >
              <span
                className={css`
                  text-transform: capitalize;
                `}
              >
                {supportType.toLowerCase()}
              </span>{" "}
              with{" "}
              {pluralizeVote(
                BigNumber.from(vote.votes.amount.amount),
                vote.votes.amount.decimals
              )}
            </span>
          )}
        </VStack>

        {vote.reason && (
          <>
            <div
              className={css`
                width: ${theme.spacing.px};
                background: #ebebeb;

                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  display: none;
                }
              `}
            />

            <VStack
              className={css`
                overflow-y: scroll;
                overflow-x: scroll;
                padding: ${theme.spacing["4"]} ${theme.spacing["6"]};

                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  padding-top: 0;
                  height: fit-content;
                }
              `}
            >
              <VoteReason fragmentKey={vote} />
            </VStack>
          </>
        )}
      </div>
    </VoteDetailsContainer>
  );
}

export function shortenId(id: string) {
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}
