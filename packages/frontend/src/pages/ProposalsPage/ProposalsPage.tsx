import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import { ProposalsPageDetailQuery } from "./__generated__/ProposalsPageDetailQuery.graphql";
import { HStack, VStack } from "../../components/VStack";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { ProposalDetailPanel } from "./ProposalDetailPanel";
import { VotesCastPanel } from "./VotesCastPanel";
import {
  ProposalsListPanel,
  selectedProposalToPath,
} from "./ProposalListPanel/ProposalsListPanel";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import {
  useNavigate,
  useParams,
} from "../../components/HammockRouter/HammockRouter";

export function ProposalsPage() {
  const { proposalId } = useParams();
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  const [proposalsListExpanded, setExpanded] = useState<boolean>(!proposalId);
  const { address: accountAddress } = useAccount();

  const result = useLazyLoadQuery<ProposalsPageDetailQuery>(
    graphql`
      query ProposalsPageDetailQuery($proposalID: ID!, $address: String!) {
        firstProposal: proposal(id: $proposalID) {
          number
          ...ProposalDetailPanelFragment
          ...VotesCastPanelFragment @arguments(address: $address)
        }
        ...ProposalsListPanelFragment
      }
    `,
    {
      proposalID: proposalId,
      address: accountAddress ?? "",
    }
  );

  // This happens if user enters an invalid proposal
  // TODO: Show a 404 page instead
  if (!result?.firstProposal?.number) {
    startTransition(() => {
      navigate({ path: "/proposals" });
    });
    return;
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isPending ? 0.3 : 1 }}
      transition={{ duration: 0.3, delay: isPending ? 0.3 : 0 }}
    >
      <HStack
        gap="16"
        justifyContent="space-between"
        alignItems="flex-start"
        className={css`
          padding-left: ${theme.spacing["4"]};
          padding-right: ${theme.spacing["4"]};
          max-width: ${theme.maxWidth["6xl"]};
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-end;
          }
        `}
      >
        <ProposalDetailPanel fragmentRef={result.firstProposal} />

        <VStack
          justifyContent="space-between"
          className={css`
            position: sticky;
            top: ${theme.spacing["20"]};
            max-height: calc(100vh - 148px);

            flex-shrink: 0;
            width: ${theme.maxWidth.sm};
            background-color: ${theme.colors.white};
            border: 1px solid ${theme.colors.gray.eb};
            border-radius: ${theme.borderRadius["xl"]};
            box-shadow: ${theme.boxShadow.newDefault};
            margin-bottom: ${theme.spacing["8"]};

            @media (max-width: ${theme.maxWidth["2xl"]}) {
              position: fixed;
              left: 16px;
              top: calc(100% - 124px);
              max-height: 108px;
              height: 108px;
              align-items: stretch;
              justify-content: flex-end;
              width: calc(100% - 32px);
              height: auto;
            }
          `}
        >
          <ProposalsListPanel
            fragmentRef={result}
            selectedProposal={{
              type: "ON_CHAIN",
              identifier: result.firstProposal.number.toString(),
            }}
            expanded={proposalsListExpanded}
            onProposalSelected={(nextSelected) =>
              startTransition(() => {
                setExpanded(false);
                navigate({
                  path: selectedProposalToPath(nextSelected),
                });
              })
            }
            toggleExpanded={() => setExpanded((expanded) => !expanded)}
          />
          <VotesCastPanel
            fragmentRef={result.firstProposal}
            expanded={proposalsListExpanded}
          />
        </VStack>
      </HStack>
    </motion.div>
  );
}
