import React, { Component } from "react";
import { Tabs, Tab } from "react-bootstrap";

import Message from "./Message";

import "../layout/components/nav.sass";

import logo from "../images/foundryWhiteLogo.png";

class Nav extends Component {
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
      (this.props.network && this.props.network !== "Matic") ||
      this.props.metaMaskMissing
    ) {
      return (
        <div className="nav__wrapper">
          {this.props.network && this.props.network !== "Matic" && (
            <p className="nav__network">
              {`Note: Please connect to the Matic network`}
            </p>
          )}
          {this.props.metaMaskMissing && (
            <p className="nav__network">
              {`Note: You need `}
              <a
                className="nav__network"
                target="_blank"
                href="https://metamask.io/"
              >
                MetaMask
              </a>
              {` to use Foundry Governance`}
            </p>
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
          <div className="nav__links">
            <button
              onClick={() => this.props.updateCurrentPage("page__proposals")}
              className={
                this.props.currentPage === "page__proposals" ? "active" : ""
              }
            >
              Proposals
            </button>
            <button
              onClick={() =>
                this.props.updateCurrentPage("page__create_payment_proposal")
              }
              className={
                this.props.currentPage === "page__create_payment_proposal"
                  ? "active"
                  : ""
              }
            >
              Create Dai Payment Proposal
            </button>
            <button
              onClick={() =>
                this.props.updateCurrentPage("page__create_custom_proposal")
              }
              className={
                this.props.currentPage === "page__create_custom_proposal"
                  ? "active"
                  : ""
              }
            >
              Create Custom Proposal
            </button>
          </div>
        )}
        {button}
      </nav>
    );
  }
}

export default Nav;
