import React, { Component } from "react";

//import upvote from "../images/upvote.svg";
//import downvote from "../images/downvote.svg";

import "../layout/components/proposals.sass";
import PopupHint from "./PopupHint";

class Proposal extends Component {
  handleVoteFor = async () => {
    const gasPrice = await this.props.getGasPrice();
    this.props.contract.methods
      .castVote(this.props.id, true)
      .send(
        { from: this.props.account, gasPrice: gasPrice },
        (err, transactionHash) => {
          this.props.setMessage("Transaction Pending...", transactionHash);
        }
      )
      .on("confirmation", (number, receipt) => {
        if (number === 0) {
          this.props.setMessage(
            "Transaction Confirmed!",
            receipt.transactionHash
          );
        }
        setTimeout(() => {
          this.props.clearMessage();
        }, 10000);
      })
      .on("error", (err, receipt) => {
        this.props.setMessage(
          "Transaction Failed.",
          receipt ? receipt.transactionHash : null
        );
      });
  };

  handleVoteAgainst = async () => {
    const gasPrice = await this.props.getGasPrice();
    this.props.contract.methods
      .castVote(this.props.id, false)
      .send(
        { from: this.props.account, gasPrice: gasPrice },
        (err, transactionHash) => {
          this.props.setMessage("Transaction Pending...", transactionHash);
        }
      )
      .on("confirmation", (number, receipt) => {
        if (number === 0) {
          this.props.setMessage(
            "Transaction Confirmed!",
            receipt.transactionHash
          );
        }
        setTimeout(() => {
          this.props.clearMessage();
          //this.props.updateProposalStates();
        }, 10000);
      })
      .on("error", (err, receipt) => {
        this.props.setMessage(
          "Transaction Failed.",
          receipt ? receipt.transactionHash : null
        );
      });
  };

  handleProgressState = async () => {
    //succeeded can be queued state: 4, queued can be executed state: 5
    let gasPrice = await this.props.getGasPrice();
    if (this.props.status === "Succeeded") {
      this.props.setStatusOf("Adding proposal to Queue ...", true);
      this.props.contract.methods
        .queue(this.props.id)
        .send(
          {
            from: this.props.account,
            gasPrice: gasPrice,
          },
          (err, transactionHash) => {
            this.props.setMessage("Transaction Pending...", transactionHash);
            this.props.setStatusOf("Transaction Pending ...", true);
          }
        )
        .on("confirmation", (number, receipt) => {
          if (number === 0) {
            this.props.setMessage(
              "Transaction Confirmed!",
              receipt.transactionHash
            );
            this.props.setStatusOf("Transaction Confirmed!", true);
          }
          setTimeout(() => {
            this.props.clearMessage();
            //this.props.updateProposalStates();
            this.props.setStatusOf("", false);
          }, 10000);
        })
        .on("error", (err, receipt) => {
          this.props.setMessage(
            "Transaction Failed.",
            receipt ? receipt.transactionHash : null
          );
          this.props.setStatusOf("Transaction failed! Please try again.", true);
        });
    } else if (this.props.status === "Queued") {
      this.props.setStatusOf("Executing proposal ...", true);
      this.props.contract.methods
        .execute(this.props.id)
        .send(
          {
            from: this.props.account,
            gasPrice: gasPrice,
          },
          (err, transactionHash) => {
            this.props.setMessage("Transaction Pending...", transactionHash);
            this.props.setStatusOf("Transaction Pending ...", true);
          }
        )
        .on("confirmation", (number, receipt) => {
          if (number === 0) {
            this.props.setMessage(
              "Transaction Confirmed!",
              receipt.transactionHash
            );
            this.props.setStatusOf("Transaction Confirmed!", true);
          }
          setTimeout(() => {
            this.props.clearMessage();
            //this.props.updateProposalStates();
            this.props.setStatusOf("", false);
          }, 10000);
        })
        .on("error", (err, receipt) => {
          this.props.setMessage(
            "Transaction Failed.",
            receipt ? receipt.transactionHash : null
          );
          this.props.setStatusOf("Transaction Failed! Please try again.", true);
        });
    } else {
      console.log("This proposal is not in the succeeded or queued states");
    }
  };

  render() {
    let totalValue =
      parseFloat(this.props.infavor) + parseFloat(this.props.against);
    let percentageValue = 100 / totalValue;
    let againstGrowth = {
      width: isNaN(parseFloat(this.props.against))
        ? "0%"
        : `${parseFloat(this.props.against) * percentageValue}%`,
    };
    let infavorGrowth = {
      width: isNaN(parseFloat(this.props.infavor))
        ? "0%"
        : `${parseFloat(this.props.infavor) * percentageValue}%`,
    };

    let arrows;

    if (
      this.props.account &&
      this.props.end > this.props.latestBlock &&
      this.props.votingPower > 0
    ) {
      arrows = (
        <div className="proposal__arrows">
          <PopupHint message={this.props.disableMessage} position="left">
            <button
              className="vote__button"
              onClick={this.handleVoteFor}
              disabled={!this.props.connected || this.props.buttonsDisabled}
            >
              Vote In Favour
            </button>
          </PopupHint>
          <PopupHint message={this.props.disableMessage} position="left">
            <button
              className="vote__button"
              onClick={this.handleVoteAgainst}
              disabled={!this.props.connected || this.props.buttonsDisabled}
            >
              Vote Against
            </button>
          </PopupHint>
        </div>
      );
    }

    return (
      <div className="proposal">
        <div className="title-flex">
          <div>
            <h4 className="proposal__title">{this.props.title}</h4>
            <span className="proposal__pill">{this.props.endDate}</span>
            <span>{this.props.endBlock}</span>
          </div>
          <div className="proposal__status">
            <div className={`status__${this.props.status}`}>
              {this.props.status}
            </div>
          </div>
        </div>
        <div className="proposal__info">
          <div className="proposal__votes">
            <div>
              <h5>
                <span>For</span> <span>{this.props.infavor}</span>
              </h5>
              <div className="bar-growth">
                <div style={infavorGrowth}></div>
              </div>
            </div>
            <div>
              <h5>
                <span>Against</span> <span>{this.props.against}</span>
              </h5>
              <div className="bar-growth against">
                <div style={againstGrowth}></div>
              </div>
            </div>
          </div>
          <div className="payment__type">
            {this.props.isPayment[0] === true
              ? "This is a simple " +
                this.props.isPayment[3] +
                " payment Proposal (" +
                this.props.isPayment[1].toString() +
                " " +
                this.props.isPayment[3] +
                " to 0x" +
                this.props.isPayment[2].toString() +
                ")"
              : null}
          </div>
        </div>
        <div className="proposal__bottom">
          <p className="proposal__description">{this.props.description}</p>
        </div>
        {arrows}
        {this.props.status === "Succeeded" ? (
          <PopupHint message={this.props.disableMessage} position="bottom">
            <button
              className="proposal__button"
              variant="secondary"
              onClick={this.handleProgressState}
              disabled={!this.props.connected || this.props.buttonsDisabled}
            >
              Add Proposal to Queue
            </button>
          </PopupHint>
        ) : null}
        {this.props.status === "Queued" ? (
          <PopupHint message={this.props.disableMessage} position="bottom">
            <button
              className="proposal__button"
              variant="secondary"
              onClick={this.handleProgressState}
              disabled={!this.props.connected || this.props.buttonsDisabled}
            >
              Execute Proposal
            </button>
          </PopupHint>
        ) : null}
      </div>
    );
  }
}

export default Proposal;
