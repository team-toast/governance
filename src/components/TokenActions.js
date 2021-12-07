import React, { Component } from "react";
import "../layout/components/tokenactions.sass";
import PopupHint from "./PopupHint";

import governatorContract from "../contracts/Governator.json";
import compTokenContract from "../contracts/Comp.json";
import contract from "../contracts/GovernorAlpha.json";

class TokenActions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      uintMaxHex:
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      uintMaxInt:
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      fryConvertAmount: 0,
      gFryConvertAmount: 0,
    };
  }

  fryToGfry = async () => {
    try {
      let gasPrice = await this.props.getGasPrice();

      console.log("Converting FRY to gFRY");

      const fryToken = new this.props.web3.eth.Contract(
        compTokenContract,
        contract.contractAddresses["fry"]["address"]
      );

      // Check allowance
      let fryAllowance = await fryToken.methods
        .allowance(
          this.props.account,
          contract.contractAddresses["governator"]["address"]
        )
        .call();

      if (fryAllowance.length !== this.state.uintMaxInt.length) {
        // Approve
        this.props.setProgress([1]);
        this.props.setStatus("Converting FRY to gFRY", true);

        await fryToken.methods
          .approve(
            contract.contractAddresses["governator"]["address"],
            this.state.uintMaxHex
          )
          .send(
            { from: this.props.account, gasPrice: gasPrice },
            (err, transactionHash) => {
              // this.props.setStatus("Transaction Pending ...", true);
              this.props.setProgress([1, 2]);
              console.log("Transaction Pending...", transactionHash);
            }
          )
          .on("confirmation", (number, receipt) => {
            if (number === 0) {
              console.log("Transaction Confirmed!", receipt.transactionHash);
              this.props.setProgress([1, 2, 3]);
              //this.readDelegateEvents(receipt);
              // this.props.setStatus("Transaction Confirmed!", true);
            }
          })
          .on("error", (err, receipt) => {
            // this.props.setStatus("Could not approve. Please try again.", true);
            this.props.setProgress([1, 2, 3]);
            console.log("Transaction Failed!");
          });
      }

      // Convert
      gasPrice = await this.props.getGasPrice();
      // this.props.setStatus("Governating ...", true);
      this.props.setStatus("Converting FRY to gFRY", true);
      const governator = new this.props.web3.eth.Contract(
        governatorContract,
        contract.contractAddresses["governator"]["address"]
      );
      await governator.methods
        .governate(
          this.props.web3.utils.toWei(
            parseFloat(this.state.fryConvertAmount).toString()
          )
        )
        .send(
          { from: this.props.account, gasPrice: gasPrice },
          (err, transactionHash) => {
            // this.props.setStatus("Transaction Pending ...", true);
            this.props.setProgress([1]);
            this.props.setProgress([1, 2]);
            console.log("Transaction Pending...", transactionHash);
          }
        )
        .on("confirmation", (number, receipt) => {
          if (number === 0) {
            console.log("Transaction Confirmed!", receipt);
            this.props.setProgress([1, 2, 3]);
            this.interpretEventAndUpdateFryToGFry(receipt);
            // this.props.setStatus("Transaction Confirmed!", true);
          }
        })
        .on("error", (err, receipt) => {
          // this.props.setStatus("Could not governate. Please try again.", true);
          this.props.setProgress([1, 2, 3]);
          console.log("Transaction Failed!");
        });

      console.log("Governate Successful");
    } catch (error) {
      console.log(error);
    }
  };

  interpretEventAndUpdateFryToGFry = async (receipt) => {
    for (var key of Object.keys(receipt.events)) {
      console.log("In for loop");
      if (
        receipt.events[key].address &&
        receipt.events[key].raw.data &&
        receipt.events[key].raw.topics[2]
      ) {
        let tmpAddress = receipt.events[key].address;
        let tmpAmount = receipt.events[key].raw.data;
        let tmpAccount = receipt.events[key].raw.topics[2];
        tmpAccount = "0x" + tmpAccount.substring(26);
        tmpAmount = parseFloat(this.props.web3.utils.fromWei(tmpAmount));

        if (
          tmpAddress.toLowerCase() ===
            contract.contractAddresses["token"]["address"].toLowerCase() &&
          tmpAccount.toLowerCase() === this.props.account.toLowerCase()
        ) {
          this.props.fryGfryMod(-1 * tmpAmount, tmpAmount);
        }
      }
    }
  };

  gFryToFry = async () => {
    try {
      let gasPrice = await this.props.getGasPrice();

      // Convert
      // this.props.setStatus("Degovernating ...", true);
      this.props.setStatus("Converting gFRY to FRY", true);
      const governator = new this.props.web3.eth.Contract(
        governatorContract,
        contract.contractAddresses["governator"]["address"]
      );
      await governator.methods
        .degovernate(
          this.props.web3.utils.toWei(
            parseFloat(this.state.gFryConvertAmount).toString()
          )
        )
        .send(
          { from: this.props.account, gasPrice: gasPrice },
          (err, transactionHash) => {
            // this.props.setStatus("Transaction Pending ...", true);
            console.log("Transaction Pending...", transactionHash);
          }
        )
        .on("confirmation", (number, receipt) => {
          if (number === 0) {
            console.log("Transaction Confirmed!", receipt);
            this.interpretEventAndUpdateGFryToFry(receipt);
            // this.props.setStatus("Transaction Confirmed!", true);
          }
        })
        .on("error", (err, receipt) => {
          // this.props.setStatus(
          //   "Could not degovernate. Please try again.",
          //   true
          // );
          console.log("Transaction Failed!");
        });

      console.log("Degovernate Successful");
    } catch (error) {
      console.log(error);
    }
  };

  interpretEventAndUpdateGFryToFry = async (receipt) => {
    for (var key of Object.keys(receipt.events)) {
      console.log("In for loop");
      if (
        receipt.events[key].address &&
        receipt.events[key].raw.data &&
        receipt.events[key].raw.topics[1]
      ) {
        let tmpAddress = receipt.events[key].address;
        let tmpAmount = receipt.events[key].raw.data;
        let tmpAccount = receipt.events[key].raw.topics[1];
        tmpAccount = "0x" + tmpAccount.substring(26);
        tmpAmount = parseFloat(this.props.web3.utils.fromWei(tmpAmount));

        if (
          tmpAddress.toLowerCase() ===
            contract.contractAddresses["token"]["address"].toLowerCase() &&
          tmpAccount.toLowerCase() === this.props.account.toLowerCase()
        ) {
          this.props.fryGfryMod(tmpAmount, -1 * tmpAmount);
          break;
        }
      }
    }
  };

  updateFryAmount = async (evt) => {
    this.setState({
      fryConvertAmount: evt.target.value,
    });
  };

  updateGFryAmount = async (evt) => {
    this.setState({
      gFryConvertAmount: evt.target.value,
    });
  };

  render() {
    return (
      this.props.delegatedAddress !== "Unknown" && (
        <div className="actionsSection">
          <div className="action">
            <div className="flex xs-xs-noflex">
              <div className="margin-top-1">
                <div className="inner-box">
                  FRY Balance
                  <div className="value-display">{this.props.fryBalance}</div>
                </div>
                {/* Has FRY */}
                <div className="flex-actions">
                  <div
                    className={
                      this.props.fryBalance !== "0"
                        ? "flex-input"
                        : "inactive flex-input"
                    }
                    data-title="Your FRY balance is 0 and therefor you can't use this function."
                  >
                    <input
                      type="number"
                      step="1"
                      min="0"
                      onChange={this.updateFryAmount}
                      placeholder="Amount of FRY"
                    />
                    <button className="width-basis" onClick={this.fryToGfry}>
                      FRY {">"} gFRY
                    </button>
                  </div>
                </div>
              </div>
              <div className="margin-top-1">
                <div className="inner-box">
                  gFRY Balance{" "}
                  <div className="value-display">{this.props.balance}</div>
                </div>
                <div className="flex-actions">
                  <div
                    className={
                      this.props.balance !== "0"
                        ? "flex-input justify-right"
                        : "inactive flex-input justify-right"
                    }
                    data-title="Your gFRY balance is 0 and therefor you can't use this function."
                  >
                    <input
                      type="number"
                      step="1"
                      min="0"
                      onChange={this.updateGFryAmount}
                      placeholder="Amount of gFRY"
                    />
                    <button className="width-basis" onClick={this.gFryToFry}>
                      gFRY {">"} FRY
                    </button>
                  </div>
                </div>
              </div>
              <div className="margin-top-1">
                <div className="inner-box">
                  Voting Power
                  <div className="value-display">
                    {(parseInt(this.props.votingPower) / 10 ** 18).toFixed(2)}
                  </div>
                </div>
                <div className="flex-actions">
                  {/* Has gFry */}
                  <div
                    className={
                      this.props.balance !== "0"
                        ? "flex-input"
                        : "inactive flex-input"
                    }
                    data-title="Your gFRY balance is 0 and therefor you can't use this function."
                  >
                    <input
                      onChange={this.props.updateDelegateeAddress}
                      placeholder="0x... Address to Delegate to"
                    />
                    <PopupHint
                      classToBeUsed="width-basis"
                      message={
                        this.props.balance === "0.00"
                          ? "You don't have governance tokens"
                          : ""
                      }
                    >
                      <button onClick={this.props.delegate}>Delegate</button>
                    </PopupHint>
                  </div>
                </div>
              </div>
            </div>
            {/* No Fry or gFry */}
            {this.props.fryBalance === "0" && this.props.balance === "0" && (
              <div>
                <h3 className="sectionHeader text-center">
                  Display no FRY getting started help message and link.
                </h3>
              </div>
            )}
          </div>
        </div>
      )
    );
  }
}

export default TokenActions;
