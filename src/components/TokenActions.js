import React, { Component } from "react";
import "../layout/components/tokenactions.sass";
import PopupHint from "./PopupHint";

import governatorContract from "../contracts/Governator.json";
import compTokenContract from "../contracts/Comp.json";
import contract from "../contracts/GovernorAlpha.json";
import incrementerABI from "../contracts/Incrementer.json";

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

        this.props.setStatus("Approving ...", true);

        await fryToken.methods
          .approve(
            contract.contractAddresses["governator"]["address"],
            this.state.uintMaxHex
          )
          .send(
            { from: this.props.account, gasPrice: gasPrice },
            (err, transactionHash) => {
              this.props.setStatus("Transaction Pending ...", true);
              console.log("Transaction Pending...", transactionHash);
            }
          )
          .on("confirmation", (number, receipt) => {
            if (number === 0) {
              console.log("Transaction Confirmed!", receipt.transactionHash);
              //this.readDelegateEvents(receipt);
              this.props.setStatus("Transaction Confirmed!", true);
            }
          })
          .on("error", (err, receipt) => {
            this.props.setStatus("Could not approve. Please try again.", true);
            console.log("Transaction Failed!");
          });
      }

      // Convert
      gasPrice = await this.props.getGasPrice();
      this.props.setStatus("Governating ...", true);
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
            this.props.setStatus("Transaction Pending ...", true);
            console.log("Transaction Pending...", transactionHash);
          }
        )
        .on("confirmation", (number, receipt) => {
          if (number === 0) {
            console.log("Transaction Confirmed!", receipt);
            this.interpretEventAndUpdateFryToGFry(receipt);
            this.props.setStatus("Transaction Confirmed!", true);
          }
        })
        .on("error", (err, receipt) => {
          this.props.setStatus("Could not governate. Please try again.", true);
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
      this.props.setStatus("Degovernating ...", true);
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
            this.props.setStatus("Transaction Pending ...", true);
            console.log("Transaction Pending...", transactionHash);
          }
        )
        .on("confirmation", (number, receipt) => {
          if (number === 0) {
            console.log("Transaction Confirmed!", receipt);
            this.interpretEventAndUpdateGFryToFry(receipt);
            this.props.setStatus("Transaction Confirmed!", true);
          }
        })
        .on("error", (err, receipt) => {
          this.props.setStatus(
            "Could not degovernate. Please try again.",
            true
          );
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

  testEventProblem = async () => {
    const incrementer = new this.props.web3.eth.Contract(
      incrementerABI,
      "0xa78F1941751347763a6125CA64958B562c974819"
    );
    //console.log(await incrementer.methods);
    //9772782

    // incrementer.getPastEvents(
    //   0xd09de08a, // method id
    //   {
    //     fromBlock: "earliest",
    //     toBlock: "latest",
    //   },
    //   this.processEvent
    // );

    incrementer.getPastEvents(
      "Incremented",
      {
        //   filter: {
        //     myIndexedParam: [20, 23],
        //     myOtherIndexedParam: "0x123456789...",
        //   }, // Using an array means OR: e.g. 20 or 23
        fromBlock: 7310994,
        toBlock: "latest",
      },
      function (error, events) {
        console.log(events);
      }
    );
    // .then(function (events) {
    //   console.log(events); // same results as the optional callback above
    // });
  };

  processEvent = async (err, data) => {
    console.log("Processing Event", data);

    if (data.length !== 0) {
      let rawData = data[0]["raw"]["data"];
      let decoded = this.props.web3.eth.abi.decodeParameters(
        ["uint256", "uint256"],
        rawData
      );
      console.log("Decoded: ", decoded);
    }
  };

  render() {
    return (
      this.props.delegatedAddress !== "Unknown" && (
        <div className="actionsSection">
          <div className="action">
            <div>
              <h1>Token Actions</h1>
              {/* Always display balances */}
              <div>
                <h3>Balances</h3>
                <h5>FRY: {this.props.fryBalance}</h5>
                <h5>gFRY: {this.props.balance}</h5>
                <h5>
                  Voting Power:{" "}
                  {(parseInt(this.props.votingPower) / 10 ** 18).toFixed(2)}
                </h5>
              </div>
            </div>
            {/* No Fry or gFry */}
            {this.props.fryBalance === "0" && this.props.balance === "0" && (
              <div>
                <h3 className="sectionHeader">
                  Display no FRY getting started help message and link.
                </h3>
              </div>
            )}
            {/* Has gFry */}
            {this.props.balance !== "0" && (
              <div>
                <div>
                  <h3 className="sectionHeader">Delegate</h3>
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
                    <button onClick={this.props.delegate}>Delegate</button>
                  </PopupHint>
                </div>
                <div>
                  <h3 className="sectionHeader">Convert gFRY to FRY</h3>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    onChange={this.updateGFryAmount}
                    placeholder="Amount of gFRY"
                  />
                  <button onClick={this.gFryToFry}>gFRY {">"} FRY</button>
                </div>
              </div>
            )}
            {/* Has FRY */}
            {this.props.fryBalance !== "0" && (
              <div>
                <h3 className="sectionHeader">Convert FRY to gFRY.</h3>
                <input
                  type="number"
                  step="1"
                  min="0"
                  onChange={this.updateFryAmount}
                  placeholder="Amount of FRY"
                />
                <button onClick={this.fryToGfry}>FRY {">"} gFRY</button>
              </div>
            )}
          </div>
          <button onClick={this.testEventProblem}>DoobieDooba</button>
        </div>
      )
    );
  }
}

export default TokenActions;
