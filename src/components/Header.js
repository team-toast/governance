import React, { Component } from "react";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
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
        <h1 className="header__title">Foundry Governance Proposals</h1>
        {this.props.delegatedAddress !== "Unknown" && (
          <div className="header__balance__white flex-power">
            <div>
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
                    ? ((this.props.votingPower / this.props.totalSupply) * 100)
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
            </div>
          </div>
        )}
        {!this.state.showDelegate && this.props.delegatedAddress !== "Unknown" && (
          <div onClick={this.toggleDelegate} className="delegate-block__button">
            <h5>Delegate</h5>
          </div>
        )}
        {this.state.showDelegate && this.props.delegatedAddress !== "Unknown" && (
          <div className="delegate-block">
            <input
              onChange={this.props.updateDelegateeAddress}
              placeholder="0x... Address to Delegate to"
            />
            <PopupHint
              message={
                this.props.balance === "0.00"
                  ? "You don't have governance tokens"
                  : ""
              }
            >
              <button
                className="header__button"
                onClick={this.props.delegate}
                disabled={
                  !this.props.connected ||
                  (this.props.disableButtons &&
                    this.props.balance === "0.00") ||
                  this.props.network !== "Matic"
                }
              >
                Delegate
              </button>
            </PopupHint>
          </div>
        )}
      </section>
    );
  }
}

export default Header;
