import { css } from "@emotion/css";
import * as theme from "../theme";
import logo from "../logo.svg";
import graphql from "babel-plugin-relay/macro";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useLazyLoadQuery } from "react-relay/hooks";
import { PageHeaderQuery } from "./__generated__/PageHeaderQuery.graphql";
import { HStack } from "./VStack";
import { Link } from "./HammockRouter/Link";
import { useLocation } from "./HammockRouter/HammockRouter";
import { icons } from "../icons/icons";
import { ProfileDropDownButton } from "./ProfileDropDownButton";
import { MobileProfileDropDownButton } from "./MobileProfileDropDownButton";
import React from "react";

export const orgName = "Optimism";

export function PageHeader() {
  const isProposalsPageActive = useLocation().pathname.startsWith("/proposals");

  return (
    <HStack
      alignItems="center"
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        margin: ${theme.spacing["8"]} auto;
        gap: ${theme.spacing["2"]};
        justify-content: space-between;
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
      `}
    >
      <Link
        className={css`
          display: flex;
          flex-direction: row;
          justify-content: center;
        `}
        to="/"
      >
        <HStack gap="3" alignItems="center">
          <img alt="logo" src={logo} />

          <span
            className={css`
              white-space: nowrap;
              font-size: ${theme.fontSize.base};
              font-weight: ${theme.fontWeight.semibold};
              color: ${theme.colors.gray["800"]};
              @media (max-width: ${theme.maxWidth.md}) {
                display: none;
              }
            `}
          >
            {orgName} Agora{" "}
            <span
              className={css`
                font-size: ${theme.fontSize.xs};
                font-weight: ${theme.fontWeight.normal};
                color: ${theme.colors.gray["500"]};
                margin-left: ${theme.spacing["1"]};
                @media (max-width: ${theme.maxWidth.md}) {
                  display: none;
                }
              `}
            >
              BETA
            </span>
          </span>
        </HStack>
      </Link>

      <>
        <HStack
          className={css`
            background-color: ${theme.colors.white};
            border-radius: ${theme.borderRadius.full};
            border: 1px solid ${theme.colors.gray.eb};
            padding: ${theme.spacing[1]};
            font-weight: ${theme.fontWeight.medium};
            box-shadow: ${theme.boxShadow.newDefault};
          `}
        >
          <Link to="/">
            <div
              className={css`
                padding: ${theme.spacing[1]} ${theme.spacing[4]};
                border-radius: ${theme.borderRadius.full};
                color: ${theme.colors.gray[700]};
                @media (max-width: ${theme.maxWidth.md}) {
                  font-size: ${theme.fontSize.sm};
                }
                ${!isProposalsPageActive &&
                css`
                  background-color: ${theme.colors.gray.fa};
                  color: inherit;
                `};
              `}
            >
              Voters
            </div>
          </Link>
          <Link to="/proposals">
            <div
              className={css`
                padding: ${theme.spacing[1]} ${theme.spacing[4]};
                border-radius: ${theme.borderRadius.full};
                color: ${theme.colors.gray[700]};
                @media (max-width: ${theme.maxWidth.md}) {
                  font-size: ${theme.fontSize.sm};
                }
                ${isProposalsPageActive &&
                css`
                  background-color: ${theme.colors.gray.fa};
                  color: inherit;
                `};
              `}
            >
              Proposals
            </div>
          </Link>
        </HStack>
      </>

      <HStack
        alignItems="center"
        gap="3"
        className={css`
          height: ${theme.spacing["6"]};
        `}
      >
        <HStack
          justifyContent="center"
          className={css`
            @media (max-width: ${theme.maxWidth.md}) {
              display: none;
            }
          `}
        >
          <DesktopButton />
        </HStack>
        <HStack
          justifyContent="center"
          className={css`
            @media (min-width: ${theme.maxWidth.md}) {
              display: none;
            }
          `}
        >
          <MobileButton />
        </HStack>
      </HStack>
    </HStack>
  );
}

export const DesktopButton = () => {
  const { address: accountAddress } = useAccount();

  const { delegate } = useLazyLoadQuery<PageHeaderQuery>(
    graphql`
      query PageHeaderQuery($address: String!, $skip: Boolean!) {
        delegate(addressOrEnsName: $address) @skip(if: $skip) {
          statement {
            __typename
          }

          ...ProfileDropDownButtonFragment
        }
      }
    `,
    {
      address: accountAddress ?? "",
      skip: !accountAddress,
    }
  );

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, hide, address, ensName }) => (
        <div
          className={css`
            background-color: ${theme.colors.gray.fa};
            border-radius: ${theme.borderRadius.full};
            cursor: pointer;
            :hover {
              background: ${theme.colors.gray[200]};
            }
          `}
        >
          {!accountAddress && (
            <div
              className={css`
                padding: ${theme.spacing[2]} ${theme.spacing[5]};
              `}
              onClick={show}
            >
              Connect Wallet
            </div>
          )}
          {accountAddress && delegate && (
            <ProfileDropDownButton
              isConnected={isConnected}
              isConnecting={isConnecting}
              show={show}
              hide={hide}
              address={address}
              ensName={ensName}
              fragment={delegate}
              hasStatment={!!delegate.statement}
            />
          )}
        </div>
      )}
    </ConnectKitButton.Custom>
  );
};

export const MobileButton = () => {
  const { address: accountAddress } = useAccount();

  const { delegate } = useLazyLoadQuery<PageHeaderQuery>(
    graphql`
      query PageHeaderMobileQuery($address: String!, $skip: Boolean!) {
        delegate(addressOrEnsName: $address) @skip(if: $skip) {
          statement {
            __typename
          }

          ...MobileProfileDropDownButtonFragment
        }
      }
    `,
    {
      address: accountAddress ?? "",
      skip: !accountAddress,
    }
  );

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, hide, address, ensName }) => {
        return (
          <div>
            {!isConnected && (
              <div onClick={show}>
                <img
                  src={icons.wallet}
                  alt="connect wallet button"
                  className={css`
                    opacity: 0.6;
                  `}
                />
              </div>
            )}
            {accountAddress && delegate && (
              <MobileProfileDropDownButton
                isConnected={isConnected}
                isConnecting={isConnecting}
                show={show}
                hide={hide}
                address={address}
                ensName={ensName}
                fragment={delegate}
                hasStatement={!!delegate.statement}
              />
            )}
          </div>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
