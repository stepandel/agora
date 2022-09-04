import { icons } from "../../icons/icons";
import { useCallback } from "react";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { Dropdown } from "./Dropdown";
import { formSectionHeadingStyle } from "./PastProposalsFormSection";
import { CloseButton } from "./CloseButton";
import { Form } from "./DelegateStatementForm";
import { HStack, VStack } from "../../components/VStack";

type IssueTypeDefinition = {
  key: string;
  title: string;
  icon: keyof typeof icons;
};

export const issueDefinitions: IssueTypeDefinition[] = [
  {
    title: "Proliferation",
    key: "proliferation",
    icon: "speakerCone",
  },
  {
    title: "Treasury management",
    key: "treasury",
    icon: "piggyBank",
  },
  {
    title: "Builder funding",
    key: "funding",
    icon: "measure",
  },
];

export type IssueState = {
  type: string;
  value: string;
};

function initialIssueState(type: string): IssueState {
  return {
    type,
    value: "",
  };
}

export const formSectionContainerStyles = css`
  padding: ${theme.spacing["8"]} ${theme.spacing["6"]};
  border-bottom-width: ${theme.spacing.px};
  border-color: ${theme.colors.gray["300"]};
`;

export function initialTopIssues(): IssueState[] {
  return [initialIssueState("treasury"), initialIssueState("proliferation")];
}

type Props = {
  form: Form;
};

export function TopIssuesFormSection({ form }: Props) {
  const topIssues = form.state.topIssues;
  const setTopIssues = form.onChange.topIssues;

  const addIssue = useCallback(
    (selectionKey: string) => {
      setTopIssues((lastIssues) => {
        const issueAlreadyExists = lastIssues.find(
          (needle) => needle.type === selectionKey
        );
        if (issueAlreadyExists) {
          return lastIssues;
        }

        return [...lastIssues, initialIssueState(selectionKey)];
      });
    },
    [setTopIssues]
  );

  const removeIssue = useCallback(
    (selectionKey: string) => {
      setTopIssues((lastIssues) =>
        lastIssues.filter((needle) => needle.type !== selectionKey)
      );
    },
    [setTopIssues]
  );

  const updateIssue = useCallback(
    (key: string, value: string) => {
      setTopIssues((lastIssues) =>
        lastIssues.map((issue) => {
          if (issue.type === key) {
            return {
              ...issue,
              value,
            };
          }

          return issue;
        })
      );
    },
    [setTopIssues]
  );

  return (
    <div className={formSectionContainerStyles}>
      <HStack gap="4" justifyContent="space-between" alignItems="baseline">
        <h3 className={formSectionHeadingStyle}>Views on top issues</h3>

        <Dropdown
          title="+ Add a new issue"
          items={issueDefinitions.map((def) => ({
            selectKey: def.key,
            title: def.title,
          }))}
          onItemClicked={addIssue}
        />
      </HStack>

      <VStack
        gap="4"
        className={css`
          margin-top: ${theme.spacing["6"]};
        `}
      >
        {topIssues.map((issue, index) => {
          const issueDef = issueDefinitions.find(
            (needle) => issue.type === needle.key
          )!;

          return (
            <HStack gap="2" alignItems="center" key={index}>
              <div
                className={css`
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: ${theme.spacing["10"]};
                  height: ${theme.spacing["10"]};
                  box-shadow: ${theme.boxShadow.md};
                  border-radius: ${theme.borderRadius.md};
                  padding: ${theme.spacing["2"]};
                  background: #fbfbfb;
                  border: 1px solid #ebebeb;
                `}
              >
                <img src={icons[issueDef.icon]} alt={issueDef.title} />
              </div>

              <VStack
                className={css`
                  flex: 1;
                  position: relative;
                `}
              >
                <VStack
                  className={css`
                    position: absolute;
                    right: 0;
                    top: 0;
                    bottom: 0;
                  `}
                >
                  <CloseButton onClick={() => removeIssue(issueDef.key)} />
                </VStack>
                <input
                  className={sharedInputStyle}
                  type="text"
                  placeholder={`On ${issueDef.title.toLowerCase()}, I believe...`}
                  value={issue.value}
                  onChange={(evt) =>
                    updateIssue(issueDef.key, evt.target.value)
                  }
                />
              </VStack>
            </HStack>
          );
        })}
      </VStack>
    </div>
  );
}

export const sharedInputStyle = css`
  background: ${theme.colors.gray["200"]};
  outline: none;
  padding: ${theme.spacing["2"]} ${theme.spacing["3"]};
  box-shadow: ${theme.boxShadow.inner};
  border-radius: ${theme.borderRadius.md};
`;
