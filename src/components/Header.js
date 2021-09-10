import React, { Component } from "react";
import "../layout/components/header.sass";
//0x7E1d0353063F01CfFa92f4a9C8A100cFE37d8264
//0x0000000000000000000000000000000000000000
class Header extends Component {
  render() {
    return (
      <section className="header">
        <h1 className="header__title">Foundry Governance Proposals</h1>
        <p className="header__balance__white">
          {"Voting Power:"}
          <text
            className={
              this.props.votingPower === "0"
                ? "header__balance__orange"
                : "header__balance__white"
            }
          >
            {` ${
              this.props.votingPower !== "0" &&
              this.props.votingPower !== 0 &&
              this.props.votingPower !== "Unknown"
                ? ((this.props.votingPower / this.props.totalSupply) * 100)
                    .toFixed(2)
                    .toString() + "%"
                : this.props.votingPower !== "Unknown"
                ? "0% (Delegation Required)"
                : "Unknown"
            }`}
          </text>
          <br />
          {`Token Balance: ${this.props.balance}`}
          <br />
          {this.props.delegatedAddress.length === 42
            ? `Delegating To: ${this.props.delegatedAddress.slice(
                0,
                4
              )}...${this.props.delegatedAddress.slice(
                this.props.delegatedAddress.length - 4,
                this.props.delegatedAddress.length
              )}`
            : `Delegating To: ${this.props.delegatedAddress}`}
        </p>
        <input
          onChange={this.props.updateDelegateeAddress}
          placeholder="Address to Delegate to"
          style={{ width: "400px" }}
        />

        <button
          className="header__button"
          onClick={this.props.delegate}
          disabled={
            !this.props.connected ||
            (this.props.disableButtons && this.props.balance === "0.00") ||
            this.props.network !== "Matic"
          }
        >
          Delegate
        </button>
      </section>
    );
  }
}

export default Header;
