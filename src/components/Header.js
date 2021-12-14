import React, { Component } from "react";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import TokenActions from "./TokenActions";
import "../layout/components/header.sass";
import PopupHint from "./PopupHint";
//0x7E1d0353063F01CfFa92f4a9C8A100cFE37d8264
//0x0000000000000000000000000000000000000000
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
            <h1 className="header__title">Foundry Governance</h1>
            <div className="header__balance__white flex-power">
              <TokenActions
                {...this.props.stateprops}
                // stateprops={this.props.stateprops}
                delegate={this.props.delegate}
                updateDelegateeAddress={this.props.updateDelegateeAddress}
                setStatus={this.props.setStatus}
                getGasPrice={this.props.getGasPrice}
                fryGfryMod={this.props.fryGfryMod}
                setProgress={this.props.setProgress}
                convertedAddress={this.props.convertedAddress}
                numberWithCommas={this.props.numberWithCommas}
              />
              {/* <div>
                {"Voting Power"}
                <span
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
                      ? (
                          (this.props.votingPower / this.props.totalSupply) *
                          100
                        )
                          .toFixed(2)
                          .toString() + "%"
                      : this.props.votingPower !== "Unknown"
                      ? "0% (Delegation Required)"
                      : "Unknown"
                  }`}
                </span>
              </div>
              <div>
                {`Token Balance`}
                <span>{this.props.balance}</span>
              </div>
              <div>
                Delegating to
                <span>
                  {this.props.delegatedAddress.length === 42
                    ? `${this.props.delegatedAddress.slice(
                        0,
                        4
                      )}...${this.props.delegatedAddress.slice(
                        this.props.delegatedAddress.length - 4,
                        this.props.delegatedAddress.length
                      )}`
                    : `${this.props.delegatedAddress}`}
                </span>
              </div> */}
            </div>
          </div>
        ) : (
          <div className="connect-wallet">
            <h1>Foundry Governance</h1>
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
            </div>
          </div>
        )}
      </section>
    );
  }
}

export default Header;
