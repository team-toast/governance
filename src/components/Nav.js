import React, { Component } from "react";

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
          className="nav__account"
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
          <nav className="nav">
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
      <nav className="nav">
        <a className="nav__brand" href="/">
          <img src={logo} alt="Compound" className="nav__brand-logo" />
          <h1 className="nav__brand-name">Foundry Governance</h1>
        </a>

        {button}
      </nav>
    );
  }
}

export default Nav;
