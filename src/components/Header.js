import React, { Component } from "react";
import TokenActions from "./TokenActions";
import "../layout/components/header.sass";
const appConfig = require("." + process.env.REACT_APP_CONFIG_FILE);

class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showDelegate: false,
        };
    }
    toggleDelegate = () => {
        this.setState({ showDelegate: true });
    };

    render() {
        return (
            <section
                className={
                    this.props.delegatedAddress !== "Unknown"
                        ? "header"
                        : "header no-bottom-padding"
                }
            >
                {this.props.delegatedAddress !== "Unknown" ? (
                    <div>
                        <h1 className="header__title">
                            {appConfig["name"]} Governance
                        </h1>
                        <div className="header__balance__white flex-power">
                            <TokenActions
                                {...this.props.stateprops}
                                delegate={this.props.delegate}
                                updateDelegateeAddress={
                                    this.props.updateDelegateeAddress
                                }
                                setStatus={this.props.setStatus}
                                getGasPrice={this.props.getGasPrice}
                                levrGlevrMod={this.props.levrGlevrMod}
                                setProgress={this.props.setProgress}
                                convertedAddress={this.props.convertedAddress}
                                numberWithCommas={this.props.numberWithCommas}
                            />
                        </div>
                    </div>
                ) : this.props.metamaskLoadError === false ? (
                    <div className="connect-wallet">
                        <h1>{appConfig["name"]} Governance</h1>
                        <div>
                            <p className="connect-wallet-p">
                                Connect a wallet to view actions & balances
                            </p>
                            <button
                                onClick={this.props.onConnect}
                                className="connect-wallet-btn"
                            >
                                CONNECT WALLET
                            </button>
                        </div>{" "}
                    </div>
                ) : (
                    <div className="connect-wallet">
                        <h1>{appConfig["name"]} Governance</h1>
                        <div>
                            <p className="error-red">
                                Metamask did not initialize correctly. Please
                                refresh the page.
                            </p>
                        </div>{" "}
                    </div>
                )}
            </section>
        );
    }
}

export default Header;
