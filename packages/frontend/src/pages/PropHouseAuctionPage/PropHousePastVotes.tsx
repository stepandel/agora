import groupBy from "lodash/groupBy";
import { css } from "@emotion/css";
import { useFragment, graphql } from "react-relay";

import { compareBy } from "../../utils/sorting";
import { VStack } from "../../components/VStack";
import * as theme from "../../theme";
import { NounResolvedLink } from "../../components/NounResolvedLink";

import { ActionButton } from "./ActionButton";
import { PropHousePastVotesFragment$key } from "./__generated__/PropHousePastVotesFragment.graphql";
import { ActionButtonVoteButtonDelegateFragment$key } from "./__generated__/ActionButtonVoteButtonDelegateFragment.graphql";

export function PropHousePastVotes({
  delegateFragmentRef,
  fragmentRef,
  expanded,
}: {
  delegateFragmentRef: ActionButtonVoteButtonDelegateFragment$key | undefined;
  fragmentRef: PropHousePastVotesFragment$key;
  expanded: boolean;
}) {
  const result = useFragment(
    graphql`
      fragment PropHousePastVotesFragment on PropHouseAuction {
        votes {
          address {
            resolvedName {
              address
              ...NounResolvedLinkFragment
            }
          }

          proposal {
            id
            title
          }

          weight
        }

        ...ActionButtonFragment
      }
    `,
    fragmentRef
  );

  const addressToVotes = Object.values(
    groupBy(result.votes, (it) => [it.address.resolvedName.address])
  ).map((values) => ({
    address: values[0].address,
    totalVotes: values.reduce((acc, it) => acc + it.weight, 0),
    byProposal: values.sort(compareBy((it) => it.weight)).reverse(),
  }));

  return (
    <VStack
      justifyContent="space-between"
      gap="4"
      className={css`
        padding-top: ${theme.spacing["8"]};
        padding-bottom: ${theme.spacing["6"]};
        font-size: ${theme.fontSize.xs};
        min-height: 0;
      `}
    >
      {expanded && !!addressToVotes.length && (
        <VStack
          className={css`
            min-height: 0;
            flex-shrink: 1;
            padding: ${theme.spacing["6"]};
            padding-top: 0;
            overflow-y: scroll;
            ::-webkit-scrollbar {
              display: none;
            }
          `}
        >
          <VStack gap="4">
            {addressToVotes.map(({ address, totalVotes, byProposal }, idx) => {
              return (
                <VStack
                  key={idx}
                  gap="2"
                  className={css`
                    font-size: ${theme.fontSize.xs};
                    line-height: ${theme.lineHeight.tight};
                    overflow-x: scroll;
                    ::-webkit-scrollbar {
                      display: none;
                    }
                  `}
                >
                  <VStack
                    justifyContent="space-between"
                    className={css`
                      font-weight: ${theme.fontWeight.semibold};
                    `}
                  >
                    <div
                      className={css`
                        color: ${theme.colors.black};
                      `}
                    >
                      <NounResolvedLink resolvedName={address.resolvedName} />
                    </div>

                    <div
                      className={css`
                        color: ${theme.colors.gray[700]};
                      `}
                    >
                      {totalVotes} votes total
                    </div>
                  </VStack>

                  <VStack>
                    {byProposal.map(({ proposal, weight }) => (
                      <div
                        key={proposal.id}
                        className={css`
                          white-space: nowrap;
                          font-weight: ${theme.fontWeight.medium};
                          color: ${theme.colors.gray["4f"]};
                        `}
                      >
                        {weight} votes for {proposal.title}
                      </div>
                    ))}
                  </VStack>
                </VStack>
              );
            })}
          </VStack>
        </VStack>
      )}

      <ActionButton
        delegateFragmentRef={delegateFragmentRef}
        fragmentRef={result}
      />
    </VStack>
  );
}
