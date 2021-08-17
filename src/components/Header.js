import React, { Component } from "react";

import "../layout/components/header.sass";
import Button from "./Button";
class Header extends Component {
  render() {
    return (
      <section className="header">
        <h1 className="header__title">Foundry Governance Proposals</h1>
        <p className="header__balance">
          {`COMP Balance: ${this.props.balance}`}
        </p>
        <input
          onChange={this.props.updateDelegateeAddress}
          placeholder="Address to Delegate to"
        />
        <Button label="Delegate" handleClick={this.props.delegate}></Button>
      </section>
    );
  }
}

export default Header;
