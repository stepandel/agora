import { useFragment } from "react-relay";
import {
  DelegateNounGridFragment$data,
  DelegateNounGridFragment$key,
} from "./__generated__/DelegateNounGridFragment.graphql";
import graphql from "babel-plugin-relay/macro";
import { NounImage } from "./NounImage";
import { css } from "@emotion/css";
import * as theme from "../theme";

type Props = {
  rows?: number;
  columns?: number;
  fragmentKey: DelegateNounGridFragment$key;
};

export function DelegateNounGrid({
  fragmentKey,
  rows = 3,
  columns = 5,
}: Props) {
  const { nounsRepresented } = useFragment<DelegateNounGridFragment$key>(
    graphql`
      fragment DelegateNounGridFragment on Delegate {
        nounsRepresented {
          id
          ...NounImageFragment
        }
      }
    `,
    fragmentKey
  );

  const possibleSlots = rows * columns;
  const overflowAmount = nounsRepresented.length - possibleSlots;

  function nounImageForNoun(
    noun: DelegateNounGridFragment$data["nounsRepresented"][0]
  ) {
    return (
      <NounImage
        className={css`
          border-radius: 50%;
          width: ${theme.spacing["12"]};
          height: ${theme.spacing["12"]};
          aspect-ratio: 1/1;
        `}
        key={noun.id}
        fragmentRef={noun}
      />
    );
  }

  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: repeat(${columns}, ${theme.spacing["12"]});
        grid-template-rows: repeat(${rows}, ${theme.spacing["12"]});
        gap: ${theme.spacing["1"]};
        padding: ${theme.spacing["2"]};
        margin: 0 auto;
      `}
    >
      {overflowAmount > 0 ? (
        <>
          {nounsRepresented.slice(0, possibleSlots - 1).map(nounImageForNoun)}
          <div
            key="overflowAmount"
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
            `}
          >
            + {overflowAmount + 1}
          </div>
        </>
      ) : (
        <>{nounsRepresented.map(nounImageForNoun)}</>
      )}
    </div>
  );
}
