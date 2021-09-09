import React, { Component } from "react";

//import upvote from "../images/upvote.svg";
//import downvote from "../images/downvote.svg";

import "../layout/components/proposals.sass";

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
      this.props.contract.methods
        .queue(this.props.id)
        .send(
          {
            from: this.props.account,
            gasPrice: gasPrice,
          },
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
    } else if (this.props.status === "Queued") {
      this.props.contract.methods
        .execute(this.props.id)
        .send(
          {
            from: this.props.account,
            gasPrice: gasPrice,
          },
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
    } else {
      console.log("This proposal is not in the succeeded or queued states");
    }
  };

  render() {
    let arrows;

    // if (
    //   this.props.account &&
    //   this.props.end > this.props.latestBlock &&
    //   this.props.votingPower > 0
    // ) {
    //   arrows = (
    //     <div className="proposal__arrows">
    //       <img
    //         src={upvote}
    //         alt="Vote for"
    //         className="proposal__arrow"
    //         onClick={this.handleVoteFor}
    //       />
    //       <img
    //         src={downvote}
    //         alt="Vote against"
    //         className="proposal__arrow"
    //         onClick={this.handleVoteAgainst}
    //       />
    //     </div>
    //   );
    // }

    if (
      this.props.account &&
      this.props.end > this.props.latestBlock &&
      this.props.votingPower > 0
    ) {
      arrows = (
        <div className="proposal__arrows">
          <button
            className="vote__button"
            onClick={this.handleVoteFor}
            disabled={!this.props.connected || this.props.buttonsDisabled}
          >
            Vote In Favour
          </button>

          <button
            className="vote__button"
            onClick={this.handleVoteAgainst}
            disabled={!this.props.connected || this.props.buttonsDisabled}
          >
            Vote Against
          </button>
        </div>
      );
    }

    return (
      <div className="proposal">
        <h4 className="proposal__title">{this.props.title}</h4>
        <div className="proposal__info">
          <p className="proposal__votes">
            <h6>Proposal Info</h6>
            {"Votes in Favour: "} {this.props.infavor}
            <br />
            {"Votes Against: "} {this.props.against}
            <br />
            {"Expiry Block: "} {this.props.endBlock}
            <br />
            {"Vote Close Time: "} {this.props.endDate}
            <br />
            {"Status: "} {this.props.status}
            <br />
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
          </p>
        </div>
        <div className="proposal__bottom">
          <p className="proposal__description">
            <h6>Description</h6>
            {this.props.description}
          </p>
        </div>
        {arrows}
        {this.props.status === "Succeeded" ? (
          <button
            className="proposal__button"
            variant="secondary"
            onClick={this.handleProgressState}
            // disabled={
            //   this.props.message === "Transaction Pending..." ||
            //   this.props.message === "Transaction Confirmed!"
            // }
            disabled={!this.props.connected || this.props.buttonsDisabled}
          >
            Add Proposal to Queue
          </button>
        ) : null}
        {this.props.status === "Queued" ? (
          <button
            className="proposal__button"
            variant="secondary"
            onClick={this.handleProgressState}
            // disabled={
            //   this.props.message === "Transaction Pending..." ||
            //   this.props.message === "Transaction Confirmed!"
            // }
            disabled={!this.props.connected || this.props.buttonsDisabled}
          >
            Execute Proposal
          </button>
        ) : null}
      </div>
    );
  }
}

export default Proposal;
