import { css } from "@emotion/css";
import * as theme from "../../theme";
import { formSectionHeadingStyle } from "./PastProposalsFormSection";
import { formSectionContainerStyles } from "./TopIssuesFormSection";
import { useState } from "react";
import { Form } from "./DelegateStatementForm";
import { Markdown } from "../../components/Markdown";
import { HStack, VStack } from "../../components/VStack";

export const tipTextStyle = css`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.gray["600"]};
`;

type DisplayMode = "write" | "preview";

const displayModeSelectorStyles = css`
  cursor: pointer;
  color: ${theme.colors.gray["600"]};
  padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
  border-radius: ${theme.borderRadius.default};

  :hover {
    background: ${theme.colors.gray["200"]};
  }
`;

const displayModeSelectorSelectedStyles = css`
  background: ${theme.colors.gray["400"]};

  :hover {
    background: ${theme.colors.gray["400"]};
  }
`;

type DelegateStatementFormSectionProps = {
  form: Form;
};

export function DelegateStatementFormSection({
  form,
}: DelegateStatementFormSectionProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("write");

  return (
    <VStack
      className={css`
        ${formSectionContainerStyles}
      `}
    >
      <HStack alignItems="baseline" justifyContent="space-between" gap="4">
        <h3 className={formSectionHeadingStyle}>Delegate statement</h3>

        <HStack gap="2">
          <div
            className={css`
              ${displayModeSelectorStyles}
              ${displayMode === "write" && displayModeSelectorSelectedStyles}
            `}
            onClick={() => setDisplayMode("write")}
          >
            Write
          </div>

          <div
            className={css`
              ${displayModeSelectorStyles}
              ${displayMode === "preview" && displayModeSelectorSelectedStyles}
            `}
            onClick={() => setDisplayMode("preview")}
          >
            Preview
          </div>
        </HStack>
      </HStack>

      {displayMode === "write" && (
        <textarea
          className={css`
            background: ${theme.colors.gray["200"]};
            padding: ${theme.spacing["4"]};
            margin-top: ${theme.spacing["2"]};
            border-radius: ${theme.borderRadius.md};
            outline: none;
            width: 100%;
            min-height: ${theme.spacing["64"]};
            box-shadow: ${theme.boxShadow.inner};
          `}
          value={form.state.delegateStatement}
          onChange={(e) => form.onChange.delegateStatement(e.target.value)}
          placeholder="I believe that..."
        />
      )}

      {displayMode === "preview" && (
        <Markdown markdown={form.state.delegateStatement} />
      )}
    </VStack>
  );
}
