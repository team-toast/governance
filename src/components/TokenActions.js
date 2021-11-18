import React, { Component } from "react";
import "../layout/components/tokenactions.sass";

class TokenActions extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div className="actions">
        <h1>Token Actions</h1>
        <h3>Balances</h3>
        <h5>FRY: x</h5>
        <h5>gFRY: ${this.props.balance}</h5>
        <h5>Voting Power: ${this.props.latestBlock}</h5>
      </div>
    );
  }
}

export default TokenActions;
