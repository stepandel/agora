import { useLazyLoadQuery } from "react-relay/hooks";
import graphql from "babel-plugin-relay/macro";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { UserIcon } from "@heroicons/react/20/solid";
import { css } from "@emotion/css";
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { NounResolvedLink } from "../../components/NounResolvedLink";
import { ReactNode } from "react";
import {
  colorForSupportType,
  SupportTextProps,
} from "../DelegatePage/VoteDetailsContainer";
import { CastVoteDialogQuery } from "./__generated__/CastVoteDialogQuery.graphql";
import { TokenAmountDisplay } from "../../components/TokenAmountDisplay";
import { OptimismGovernorV5 } from "../../contracts/generated";
import { governorTokenContract } from "../../contracts/contracts";
import { useContractWrite } from "../../hooks/useContractWrite";
import { useAccount } from "wagmi";
import { icons } from "../../icons/icons";
import { Link } from "../../components/HammockRouter/Link";

type Props = {
  proposalId: string;
  reason: string;
  supportType: SupportTextProps["supportType"];
  closeDialog: () => void;
};

// TODO: Better rendering for users with no voting power
export function CastVoteDialog(props: Props) {
  return (
    <VStack
      alignItems="center"
      className={css`
        padding: ${theme.spacing["8"]};
      `}
    >
      <Dialog.Panel
        as={motion.div}
        initial={{
          scale: 0.9,
          translateY: theme.spacing["8"],
        }}
        animate={{ translateY: 0, scale: 1 }}
        className={css`
          width: 100%;
          max-width: ${theme.maxWidth.xs};
          background: ${theme.colors.white};
          border-radius: ${theme.spacing["3"]};
          padding: ${theme.spacing["6"]};
        `}
      >
        <CastVoteDialogContents {...props} />
      </Dialog.Panel>
    </VStack>
  );
}

function CastVoteDialogContents({
  proposalId,
  reason,
  supportType,
  closeDialog,
}: Props) {
  const { address: accountAddress } = useAccount();

  const { delegate } = useLazyLoadQuery<CastVoteDialogQuery>(
    graphql`
      query CastVoteDialogQuery(
        $accountAddress: String!
        $skip: Boolean!
        $proposalId: ID!
      ) {
        delegate(addressOrEnsName: $accountAddress) @skip(if: $skip) {
          statement {
            __typename
          }

          address {
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }

          tokensRepresentedSnapshot(proposalId: $proposalId) {
            amount {
              ...TokenAmountDisplayFragment
            }
          }
        }
      }
    `,
    {
      accountAddress: accountAddress ?? "",
      skip: !accountAddress,
      proposalId,
    }
  );

  const { write, isLoading, isSuccess } = useContractWrite<
    OptimismGovernorV5,
    "castVoteWithReason"
  >(
    governorTokenContract,
    "castVoteWithReason",
    [proposalId, ["AGAINST", "FOR", "ABSTAIN"].indexOf(supportType), reason],
    () => {}
  );

  if (!delegate) {
    // todo: log
    return null;
  }

  return (
    <VStack
      gap="6"
      className={css`
        font-size: ${theme.fontSize["xs"]};
      `}
    >
      {/* TODO: Spaghetti code copied from VotesCastPanel */}
      <VStack gap="2">
        <HStack
          justifyContent="space-between"
          className={css`
            font-weight: ${theme.fontWeight.semibold};
            line-height: ${theme.lineHeight.none};
          `}
        >
          <HStack
            className={css`
              color: ${theme.colors.black};
            `}
          >
            {delegate.address?.resolvedName ? (
              <NounResolvedLink resolvedName={delegate.address?.resolvedName} />
            ) : (
              "anonymous"
            )}
            <div
              className={css`
                color: ${colorForSupportType(supportType)};
              `}
            >
              &nbsp;voting {supportType.toLowerCase()}
            </div>
          </HStack>
          <HStack
            className={css`
              color: #66676b;
            `}
          >
            <div>
              <TokenAmountDisplay
                fragment={delegate.tokensRepresentedSnapshot.amount}
              />
            </div>
            <div
              className={css`
                width: ${theme.spacing["4"]};
                height: ${theme.spacing["4"]};
              `}
            >
              <UserIcon />
            </div>
          </HStack>
        </HStack>
        <div
          className={css`
            color: ${theme.colors.gray["4f"]};
          `}
        >
          {reason ? reason : "No reason provided"}
        </div>
      </VStack>
      {/* TO DO: ADD IS SUCCESS STATE */}
      {isLoading && <LoadingVote />}
      {isSuccess && <SuccessMessage />}
      {!isLoading && !isSuccess && (
        <div>
          {delegate.statement ? (
            <HStack
              className={css`
                width: 100%;
                z-index: 1;
                position: relative;
                padding: ${theme.spacing["4"]};
                border-radius: ${theme.spacing["2"]};
                border: 1px solid ${theme.colors.gray.eb};
              `}
              justifyContent="space-between"
              alignItems="center"
            >
              <VStack>
                <div
                  className={css`
                    font-weight: ${theme.fontWeight.semibold};
                  `}
                >
                  Using{" "}
                  <TokenAmountDisplay
                    fragment={delegate.tokensRepresentedSnapshot.amount}
                  />
                </div>
                <div
                  className={css`
                    font-weight: ${theme.fontWeight.medium};
                    color: ${theme.colors.gray[700]};
                  `}
                >
                  Delegated to you
                </div>
              </VStack>
              <VoteButton onClick={write}>Vote</VoteButton>
            </HStack>
          ) : (
            <NoStatementView />
          )}
        </div>
      )}
    </VStack>
  );
}

const VoteButton = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
}) => {
  return (
    <div
      onClick={onClick}
      className={css`
        text-align: center;
        border-radius: ${theme.spacing["2"]};
        border: 1px solid ${theme.colors.gray.eb};
        font-weight: ${theme.fontWeight.semibold};
        font-size: ${theme.fontSize.xs};
        color: ${theme.colors.black};
        padding: ${theme.spacing["2"]} ${theme.spacing["6"]};
        cursor: pointer;

        ${!onClick &&
        css`
          background: ${theme.colors.gray.eb};
          color: ${theme.colors.gray["700"]};
          cursor: not-allowed;
        `}

        :hover {
          background: ${theme.colors.gray.eb};
        }
      `}
    >
      {children}
    </div>
  );
};

export function SuccessMessage() {
  return (
    <HStack
      justifyContent="space-between"
      alignItems="center"
      className={css`
        width: 100%;
        z-index: 1;
        position: relative;
        padding: ${theme.spacing["4"]};
        border-radius: ${theme.spacing["2"]};
        border: 1px solid ${theme.colors.gray.eb};
      `}
    >
      <div
        className={css`
          font-weight: ${theme.fontWeight.medium};
        `}
      >
        Success! Your vote has been cast. It will appear once the transaction is
        confirmed.
      </div>
      <img
        src={icons.ballot}
        alt={icons.ballot}
        className={css`
          height: 20px;
        `}
      />
    </HStack>
  );
}

export function LoadingVote() {
  return (
    <HStack
      justifyContent="space-between"
      alignItems="center"
      className={css`
        width: 100%;
        z-index: 1;
        position: relative;
        padding: ${theme.spacing["4"]};
        border-radius: ${theme.spacing["2"]};
        border: 1px solid ${theme.colors.gray.eb};
      `}
    >
      <div
        className={css`
          font-weight: ${theme.fontWeight.medium};
        `}
      >
        Writing your vote to the chain
      </div>
      <img src={icons.spinner} alt={icons.spinner} />
    </HStack>
  );
}

export function NoStatementView() {
  return (
    <VStack
      className={css`
        width: 100%;
        z-index: 1;
        position: relative;
        padding: ${theme.spacing["4"]};
        border-radius: ${theme.spacing["2"]};
        border: 1px solid ${theme.colors.gray.eb};
      `}
    >
      You do not have a delegate statement.{" "}
      <Link
        to="/create"
        className={css`
          text-decoration: underline;
        `}
      >
        Please set one up in order to vote.
      </Link>
    </VStack>
  );
}
