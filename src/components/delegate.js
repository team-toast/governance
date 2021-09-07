import React, { Component } from "react";

import "../layout/components/delegate.sass";

class Delegate extends Component {
  render() {
    return (
      <section className="delegate">
        <p>
          {this.props.latestBlock
            ? `Latest Block: ${this.props.latestBlock}`
            : "Connect Wallet"}
        </p>
        <p>{this.props.network}</p>
      </section>
    );
  }
}

export default Footer;
