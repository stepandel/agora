import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCardFragment$key } from "./__generated__/VoterCardFragment.graphql";
import { NounResolvedName } from "../../components/NounResolvedName";
import { NounsRepresentedGrid } from "../../components/NounGrid";
import { HStack, VStack } from "../../components/VStack";
import { shadow } from "../DelegatePage/VoterPanel";
import { icons } from "../../icons/icons";

type VoterCardProps = {
  fragmentRef: VoterCardFragment$key;
};

export function VoterCard({ fragmentRef }: VoterCardProps) {
  const delegate = useFragment(
    graphql`
      fragment VoterCardFragment on WrappedDelegate {
        id

        address {
          resolvedName {
            ...NounResolvedNameFragment
          }
        }

        statement {
          statement
          twitter
          discord
        }

        delegate {
          id

          votes {
            id
          }

          ...NounGridFragment
        }
      }
    `,
    fragmentRef
  );

  return (
    <Link to={`/delegate/${delegate.id}`}>
      <VStack
        className={css`
          padding: ${theme.spacing["6"]};
          border-radius: ${theme.spacing["3"]};
          background: ${theme.colors.white};
          border-width: ${theme.spacing.px};
          border-color: ${theme.colors.gray["300"]};
          box-shadow: ${theme.boxShadow.newDefault};
          cursor: pointer;
        `}
      >
        {delegate.delegate ? (
          <NounsRepresentedGrid fragmentKey={delegate.delegate} />
        ) : (
          <HStack>
            <img src={icons.anonNoun} />
          </HStack>
        )}

        <HStack
          justifyContent="space-between"
          className={css`
            margin-top: ${theme.spacing["5"]};
          `}
        >
          <div
            className={css`
              font-weight: ${theme.fontWeight.semibold};
            `}
          >
            <NounResolvedName resolvedName={delegate.address.resolvedName} />
          </div>

          {delegate.delegate && (
            <div>Voted {delegate.delegate.votes.length} times</div>
          )}
        </HStack>

        {/*{delegate.statement?.statement && (*/}
        {/*  <Markdown markdown={delegate.statement?.statement} />*/}
        {/*)}*/}
      </VStack>
    </Link>
  );
}
