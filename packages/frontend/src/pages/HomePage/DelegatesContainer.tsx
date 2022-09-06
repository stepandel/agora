import { usePaginationFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import { DelegatesContainerFragment$key } from "./__generated__/DelegatesContainerFragment.graphql";
import { HStack, VStack } from "../../components/VStack";
import { useState } from "react";
import { WrappedDelegatesOrder } from "./__generated__/DelegatesContainerPaginationQuery.graphql";
import { Selector } from "./Selector";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
};

const orderNames: { [K in WrappedDelegatesOrder]?: string } = {
  mostNounsRepresented: "Most nouns represented",
  mostRecentlyActive: "Most recently active",
};

export function DelegatesContainer({ fragmentKey }: Props) {
  const [orderBy, setOrderBy] = useState<WrappedDelegatesOrder>(
    "mostNounsRepresented"
  );

  const {
    data: { voters },
    loadNext,
    hasNext,
    isLoadingNext,
    refetch,
  } = usePaginationFragment(
    graphql`
      fragment DelegatesContainerFragment on Query
      @argumentDefinitions(
        first: { type: "Int", defaultValue: 30 }
        after: { type: "String" }
        orderBy: {
          type: "WrappedDelegatesOrder"
          defaultValue: mostNounsRepresented
        }
      )
      @refetchable(queryName: "DelegatesContainerPaginationQuery") {
        voters: wrappedDelegates(
          first: $first
          after: $after
          orderBy: $orderBy
        ) @connection(key: "DelegatesContainerFragment_voters") {
          edges {
            node {
              id
              ...VoterCardFragment
            }
          }
        }
      }
    `,
    fragmentKey
  );

  return (
    <VStack
      alignItems="center"
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        padding-top: ${theme.spacing["16"]};
        padding-bottom: ${theme.spacing["16"]};
        /* padding-left: ${theme.spacing["4"]}; */
        /* padding-right: ${theme.spacing["4"]}; */
      `}
    >
      <VStack
        className={css`
          width: 100%;
          margin-bottom: ${theme.spacing["8"]};
        `}
      >
        <HStack alignItems="baseline" gap="2" justifyContent="space-between">
          <h2
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: bolder;
            `}
          >
            Voters
          </h2>

          <Selector
            items={Object.entries(orderNames).map(
              ([value, title]): SelectorItem<WrappedDelegatesOrder> => ({
                title,
                value: value as WrappedDelegatesOrder,
              })
            )}
            value={orderBy}
            onChange={(orderBy) => {
              refetch({ orderBy });
              setOrderBy(orderBy);
            }}
          />
        </HStack>
      </VStack>

      <div
        className={css`
          display: grid;
          grid-template-columns: repeat(3, calc(${theme.spacing["12"]} * 7.55));
          gap: ${theme.spacing["8"]};
          width: 100%;
          /* max-width: ${theme.maxWidth["6xl"]}; */
        `}
      >
        {voters.edges.map(({ node: voter }) => (
          <VoterCard key={voter.id} fragmentRef={voter} />
        ))}

        {isLoadingNext && <div>loading</div>}
        {hasNext && <button onClick={() => loadNext(30)}>Load More!</button>}
      </div>
    </VStack>
  );
}
