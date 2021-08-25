import React, { Component } from "react";

import "../layout/components/header.sass";
//import Button from "./Button";
import { Button } from "react-bootstrap";
class Header extends Component {
  render() {
    return (
      <section className="header">
        <h1 className="header__title">Foundry Governance Proposals</h1>
        <p className="header__balance">
          {`Voting Power: ${
            this.props.votingPower !== 0
              ? ((this.props.votingPower / this.props.totalSupply) * 100)
                  .toFixed(4)
                  .toString() + "%"
              : "0%"
          }`}
        </p>
        <input
          onChange={this.props.updateDelegateeAddress}
          placeholder="Address to Delegate to"
        />

        <Button
          className="header__button"
          variant="secondary"
          onClick={this.props.delegate}
        >
          Delegate
        </Button>
      </section>
    );
  }
}

export default Header;
