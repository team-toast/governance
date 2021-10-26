import React, { Component } from "react";

import "../layout/components/footer.sass";

class Footer extends Component {
  render() {
    return (
      <section className="footer">
        <p className="footer__block">
          {this.props.latestBlock
            ? `Latest Block: ${this.props.latestBlock}`
            : "Connect Wallet"}
        </p>
        <p className="footer__network">{this.props.network}</p>

        <a
          className="source_code"
          target="_blank"
          href="https://polygonscan.com/address/0xD11749591742C84eE8922c9C72E3B0317013974d#code"
        >
          {`Smart Contracts`}
        </a>
      </section>
    );
  }
}

export default Footer;
