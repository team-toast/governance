import React, { Component } from "react";
import "../layout/components/header.sass";

class Header extends Component {
  render() {
    return (
      <section className="header">
        <h1 className="header__title">Foundry Governance Proposals</h1>
        <p className="header__balance">
          {`Voting Power: ${
            this.props.votingPower !== 0
              ? ((this.props.votingPower / this.props.totalSupply) * 100)
                  .toFixed(2)
                  .toString() + "%"
              : "0%"
          }`}
          <br />
          {`Token Balance: ${this.props.balance}`}
          <br />
          {`Delegating To: ${this.props.delegatedAddress}`}
        </p>
        <input
          onChange={this.props.updateDelegateeAddress}
          placeholder="Address to Delegate to"
          style={{ width: "400px" }}
        />

        <button className="header__button" onClick={this.props.delegate}>
          Delegate
        </button>
      </section>
    );
  }
}

export default Header;
