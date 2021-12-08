import React, { Component } from "react";

import Message from "./Message";

import "../layout/components/nav.sass";

import logo from "../images/foundryWhiteLogo.png";

class Nav extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMobileMenu: false,
    };
  }
  toggleMobileMenu = (data) => {
    this.setState({
      showMobileMenu: data,
    });
  };
  render() {
    let button;

    if (this.props.message) {
      button = <Message {...this.props} />;
    } else {
      button = (
        <p
          tooltip={
            this.props.connected ? "Disconnect wallet" : "Connect wallet"
          }
          className={
            this.props.connected
              ? "nav__account connected-wallet"
              : "nav__account"
          }
          onClick={
            this.props.connected ? this.props.disconnect : this.props.onConnect
          }
        >
          {this.props.account
            ? `${this.props.account.slice(0, 4)}...${this.props.account.slice(
                this.props.account.length - 4,
                this.props.account.length
              )}`
            : "Connect Wallet"}
        </p>
      );
    }

    if (
      (this.props.network && this.props.network !== "Arbitrum") ||
      this.props.metaMaskMissing
    ) {
      return (
        <div className="nav__wrapper">
          {this.props.network && this.props.network !== "Arbitrum" && (
            <p className="nav__network">
              {`Note: Please connect to the Arbitrum network`}
            </p>
          )}
          {this.props.metaMaskMissing && (
            <div>
              <p className="nav__network">
                <a
                  className="nav__network"
                  target="_blank"
                  href="https://metamask.io/"
                >
                  {`Note: To use Foundry Governance you need MetaMask`}
                </a>
              </p>
            </div>
          )}
          <nav className="nav top-nav">
            <a className="nav__brand" href="/">
              <img src={logo} alt="Compound" className="nav__brand-logo" />
              <h1 className="nav__brand-name">Foundry Governance</h1>
            </a>
            {button}
          </nav>
        </div>
      );
    }

    return (
      <nav className="nav top-nav">
        <a className="nav__brand" href="/">
          <img src={logo} alt="Compound" className="nav__brand-logo" />
          <h1 className="nav__brand-name">Foundry Governance</h1>
        </a>
        {this.props.connected && (
          <div
            className={
              this.state.showMobileMenu
                ? "nav__links show-mobile-nav"
                : "nav__links"
            }
          >
            {this.state.showMobileMenu && (
              <div
                onClick={() => this.toggleMobileMenu(false)}
                className="nav-overlay"
              ></div>
            )}
            <div className="nav-of-links">
              <button
                onClick={() => {
                  this.props.updateCurrentPage("page__proposals");
                  this.toggleMobileMenu(false);
                }}
                className={
                  this.props.currentPage === "page__proposals" ? "active" : ""
                }
              >
                Proposals
              </button>
              <button
                onClick={() => {
                  this.props.updateCurrentPage("page__create_payment_proposal");
                  this.toggleMobileMenu(false);
                }}
                className={
                  this.props.currentPage === "page__create_payment_proposal"
                    ? "active"
                    : ""
                }
              >
                Create Dai Payment Proposal
              </button>
              <button
                onClick={() => {
                  this.props.updateCurrentPage("page__create_custom_proposal");
                  this.toggleMobileMenu(false);
                }}
                className={
                  this.props.currentPage === "page__create_custom_proposal"
                    ? "active"
                    : ""
                }
              >
                Create Custom Proposal
              </button>
            </div>
          </div>
        )}

        <div className="flex-equal-width">
          {button}
          {this.props.connected && (
            <button
              onClick={() => this.toggleMobileMenu(!this.state.showMobileMenu)}
              className={
                this.state.showMobileMenu
                  ? "mobile-menu-button menu-is-showing"
                  : "mobile-menu-button"
              }
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          )}
        </div>
      </nav>
    );
  }
}

export default Nav;
