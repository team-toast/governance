import React, { Component } from "react";

//import upvote from "../images/upvote.svg";
//import downvote from "../images/downvote.svg";

import "../layout/components/proposals.sass";
import PopupHint from "./PopupHint";

class Proposal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showBody: false,
    };
  }
  toggleShowBody = () => {
    this.setState({ showBody: true });
  };
  handleVoteFor = async () => {
    this.props.setStatusOf("Voting In Favour ...", true);
    const gasPrice = await this.props.getGasPrice();
    this.props.contract.methods
      .castVote(this.props.id, true)
      .send(
        { from: this.props.account, gasPrice: gasPrice },
        (err, transactionHash) => {
          this.props.setMessage("Transaction Pending...", transactionHash);
          this.props.setStatusOf("Voting Pending ...", true);
        }
      )
      .on("confirmation", (number, receipt) => {
        if (number === 0) {
          this.props.setMessage(
            "Transaction Confirmed!",
            receipt.transactionHash
          );
          this.props.setStatusOf("Voted Successfully!", true);
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
        this.props.setStatusOf("Voting failed. Please try again.", true);
      });
  };

  handleVoteAgainst = async () => {
    this.props.setStatusOf("Voting Against ...", true);
    const gasPrice = await this.props.getGasPrice();
    this.props.contract.methods
      .castVote(this.props.id, false)
      .send(
        { from: this.props.account, gasPrice: gasPrice },
        (err, transactionHash) => {
          this.props.setMessage("Transaction Pending...", transactionHash);
          this.props.setStatusOf("Voting Pending ...", true);
        }
      )
      .on("confirmation", (number, receipt) => {
        if (number === 0) {
          this.props.setMessage(
            "Transaction Confirmed!",
            receipt.transactionHash
          );
          this.props.setStatusOf("Voted Successfully.", true);
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
        this.props.setStatusOf("Voting failed. Please try again.", true);
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

    let arrowsInFavour;
    let arrowsAgainst;

    if (
      this.props.account &&
      this.props.end > this.props.latestBlock &&
      this.props.votingPower > 0
    ) {
      arrowsAgainst = (
        <div className="proposal__arrows">
          <PopupHint message={this.props.disableMessage} position="left">
            <button
              className="vote__button against"
              onClick={this.handleVoteAgainst}
              disabled={!this.props.connected || this.props.buttonsDisabled}
            >
              Vote Against
            </button>
          </PopupHint>
        </div>
      );
      arrowsInFavour = (
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
        </div>
      );
    }

    return (
      <div
        className={
          this.state.showBody
            ? `proposal noBorder current-state-${this.props.status}`
            : `proposal showBorder current-state-${this.props.status}`
        }
      >
        <div className="title-flex" onClick={this.toggleShowBody}>
          <div>
            <h4 className="proposal__title">{this.props.title}</h4>
            <span className="proposal__pill">{this.props.endDate}</span>
            <span className="proposal__block">{this.props.endBlock}</span>
          </div>
          <div className="proposal__status">
            <div className={`status__${this.props.status}`}>
              {this.props.status}
            </div>
          </div>
        </div>
        {this.state.showBody && (
          <div className="proposal__info">
            <div className="proposal__votes">
              <div>
                <h5>
                  <span>For</span>{" "}
                  <span>{Number(parseFloat(this.props.infavor))}</span>
                </h5>
                <div className="bar-growth">
                  <div style={infavorGrowth}></div>
                </div>
                {arrowsInFavour}
              </div>
              <div>
                <h5>
                  <span>Against</span>{" "}
                  <span>{parseInt(parseFloat(this.props.against))}</span>
                </h5>
                <div className="bar-growth against">
                  <div style={againstGrowth}></div>
                </div>
                {arrowsAgainst}
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
        )}
        {this.state.showBody && (
          <div className="proposal__bottom">
            <p className="proposal__description">{this.props.description}</p>
          </div>
        )}
        {this.props.status === "Succeeded" && this.state.showBody ? (
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
        {this.props.status === "Queued" && this.state.showBody ? (
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
