import React, { Component } from "react";
import "../layout/components/footer.sass";
const appConfig = require("." + process.env.REACT_APP_CONFIG_FILE);

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
                    rel="noopener noreferrer"
                    href={appConfig["smartContractLink"]}
                >
                    {`Smart Contracts`}
                </a>
            </section>
        );
    }
}

export default Footer;
