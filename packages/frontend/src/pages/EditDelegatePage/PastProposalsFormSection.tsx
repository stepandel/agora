import { css } from "@emotion/css";
import useClickOutside from "@restart/ui/useClickOutside";
import graphql from "babel-plugin-relay/macro";
import { BigNumber } from "ethers";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFragment } from "react-relay";

import { VStack } from "../../components/VStack";
import * as theme from "../../theme";

import { CloseButton } from "./CloseButton";
import { Form } from "./DelegateStatementForm";
import {
  formSectionContainerStyles,
  sharedInputStyle,
} from "./TopIssuesFormSection";
import { PastProposalsFormSectionProposalListFragment$key } from "./__generated__/PastProposalsFormSectionProposalListFragment.graphql";

type Props = {
  queryFragment: PastProposalsFormSectionProposalListFragment$key;
  form: Form;
};

export const formSectionHeadingStyle = css`
  font-weight: bold;
`;

export function PastProposalsFormSection({ queryFragment, form }: Props) {
  return (
    <div className={formSectionContainerStyles}>
      <VStack>
        <h3 className={formSectionHeadingStyle}>Views on past proposals</h3>

        <VStack
          gap="4"
          className={css`
            margin-top: ${theme.spacing["4"]};
          `}
        >
          <ProposalList
            selectedProposals={form.state.mostValuableProposals}
            setSelectedProposals={form.onChange.mostValuableProposals}
            title="Most valuable"
            queryFragment={queryFragment}
          />

          <ProposalList
            selectedProposals={form.state.leastValuableProposals}
            setSelectedProposals={form.onChange.leastValuableProposals}
            title="Least valuable"
            queryFragment={queryFragment}
          />
        </VStack>
      </VStack>
    </div>
  );
}

type ProposalListProps = {
  title: string;
  queryFragment: PastProposalsFormSectionProposalListFragment$key;
  setSelectedProposals: (
    updater: (oldProposals: SelectedProposal[]) => SelectedProposal[]
  ) => void;
  selectedProposals: SelectedProposal[];
};

function ProposalList({
  title,
  queryFragment,
  selectedProposals,
  setSelectedProposals,
}: ProposalListProps) {
  const { allProposals } = useFragment(
    graphql`
      fragment PastProposalsFormSectionProposalListFragment on Query {
        allProposals: proposals {
          # eslint-disable-next-line relay/unused-fields
          id
          number
          title
        }
      }
    `,
    queryFragment
  );

  const [filterText, setFilterText] = useState("");

  const mappedProposals: SearchableProposal[] = useMemo(
    () =>
      allProposals.map((proposal) => {
        const title = proposal.title;

        return {
          number: BigNumber.from(proposal.number).toNumber(),
          title,
          searchValue: `#${proposal.number} ${title ?? ""}`.toLowerCase(),
        };
      }),
    [allProposals]
  );

  const firstStageFilteredProposals = useMemo(
    () => proposalsMatchingText(mappedProposals, filterText),
    [mappedProposals, filterText]
  );

  const filteredProposals = useMemo(
    () =>
      proposalsNotIncludingSelected(
        firstStageFilteredProposals,
        selectedProposals
      ),
    [firstStageFilteredProposals, selectedProposals]
  );

  const removeSelectedProposal = useCallback(
    function removeSelectedProposal(number: number) {
      setSelectedProposals((oldProposals) =>
        oldProposals.filter((proposal) => proposal.number !== number)
      );
    },
    [setSelectedProposals]
  );

  const selectedProposalsWithSearchableProposal = useMemo(
    () =>
      selectedProposals.flatMap((selectedProposal) => {
        const proposal = mappedProposals.find(
          (needle) => needle.number === selectedProposal.number
        );
        if (!proposal) {
          return [];
        }

        return proposal;
      }),
    [selectedProposals, mappedProposals]
  );

  const [isFocused, setIsFocused] = useState(false);

  const setFocused = useCallback(() => {
    setIsFocused(true);
  }, [setIsFocused]);

  const setBlurred = useCallback(() => {
    setIsFocused(false);
  }, [setIsFocused]);

  const handleSuggestedProposalClicked = useCallback(
    function handleSuggestedProposalClicked(proposal: SearchableProposal) {
      setSelectedProposals((last) => [...last, { number: proposal.number }]);
      setFilterText("");
      setBlurred();
    },
    [setSelectedProposals, setFilterText, setBlurred]
  );

  const focusContainerRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(focusContainerRef, setBlurred);

  return (
    <VStack
      gap="1"
      className={css`
        flex: 1;
      `}
    >
      <h3
        className={css`
          font-size: ${theme.fontSize.sm};
          font-weight: bold;
        `}
      >
        {title}
      </h3>

      {selectedProposalsWithSearchableProposal.map((proposal) => (
        <ProposalCard
          key={proposal.number}
          proposal={proposal}
          onClose={() => removeSelectedProposal(proposal.number)}
        />
      ))}

      <div
        ref={focusContainerRef}
        className={css`
          display: flex;
          flex-direction: column;
          gap: ${theme.spacing["2"]};

          position: relative;
        `}
      >
        <input
          className={css`
            ${sharedInputStyle}
          `}
          placeholder="Start typing to search proposals "
          type="text"
          value={filterText}
          onFocus={setFocused}
          onChange={(e) => setFilterText(e.target.value)}
        />

        <VStack
          className={css`
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            border-color: ${theme.colors.gray["300"]};
            box-shadow: ${theme.boxShadow.newDefault};
            z-index: 3;
          `}
        >
          {isFocused &&
            filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.number}
                proposal={proposal}
                onClick={() => handleSuggestedProposalClicked(proposal)}
              />
            ))}
        </VStack>
      </div>
    </VStack>
  );
}

export type SelectedProposal = {
  number: number;
};

type SearchableProposal = {
  number: number;
  title: string | null;
  searchValue: string;
};

function proposalsNotIncludingSelected(
  proposals: SearchableProposal[],
  selected: SelectedProposal[]
): SearchableProposal[] {
  return proposals.filter(
    (searchableProposal) =>
      !selected.find(
        (selectedProposal) =>
          selectedProposal.number === searchableProposal.number
      )
  );
}

function proposalsMatchingText(
  proposals: SearchableProposal[],
  filterText: string
): SearchableProposal[] {
  return proposals.filter((proposal) =>
    proposal.searchValue.includes(filterText.toLowerCase())
  );
}

type ProposalCardProps = {
  proposal: SearchableProposal;
  onClick?: () => void;
  onClose?: () => void;
};

function ProposalCard({ proposal, onClick, onClose }: ProposalCardProps) {
  return (
    <div
      onClick={onClick}
      className={css`
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        background-color: ${theme.colors.white};

        ${onClick &&
        css`
          cursor: pointer;

          :hover {
            background: ${theme.colors.gray["200"]};
          }
        `}
      `}
    >
      <div
        className={css`
          padding: ${theme.spacing["3"]} ${theme.spacing["3"]};
        `}
      >
        #{proposal.number} - {proposal.title}
      </div>

      {onClose && <CloseButton onClick={onClose} />}
    </div>
  );
}
