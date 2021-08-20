import React, { Component } from "react";

import upvote from "../images/upvote.svg";
import downvote from "../images/downvote.svg";

import "../layout/components/proposals.sass";
import Button from "./Button";

class Proposal extends Component {
  proposalStateMap = [
    "Pending",
    "Active",
    "Canceled",
    "Defeated",
    "Succeeded",
    "Queued",
    "Expired",
    "Executed",
    "Unknown",
  ];

  handleVoteFor = () => {
    this.props.contract.methods
      .castVote(this.props.id, true)
      .send({ from: this.props.account }, (err, transactionHash) => {
        this.props.setMessage("Transaction Pending...", transactionHash);
      })
      .on("confirmation", (number, receipt) => {
        if (number === 0) {
          this.props.setMessage(
            "Transaction Confirmed!",
            receipt.transactionHash
          );
        }
        setTimeout(() => {
          this.props.clearMessage();
        }, 5000);
      })
      .on("error", (err, receipt) => {
        this.props.setMessage(
          "Transaction Failed.",
          receipt ? receipt.transactionHash : null
        );
      });
  };

  handleVoteAgainst = () => {
    this.props.contract.methods
      .castVote(this.props.id, false)
      .send({ from: this.props.account }, (err, transactionHash) => {
        this.props.setMessage("Transaction Pending...", transactionHash);
      })
      .on("confirmation", (number, receipt) => {
        if (number === 0) {
          this.props.setMessage(
            "Transaction Confirmed!",
            receipt.transactionHash
          );
        }
        setTimeout(() => {
          this.props.clearMessage();
        }, 5000);
      })
      .on("error", (err, receipt) => {
        this.props.setMessage(
          "Transaction Failed.",
          receipt ? receipt.transactionHash : null
        );
      });
  };

  handleProgressState = () => {
    //succeeded can be queued state: 4, queued can be executed state: 5
    if (this.proposalStateMap[this.props.status] === "Succeeded") {
      this.props.contract.methods
        .queue(this.props.id)
        .send({ from: this.props.account }, (err, transactionHash) => {
          this.props.setMessage("Transaction Pending...", transactionHash);
        })
        .on("confirmation", (number, receipt) => {
          if (number === 0) {
            this.props.setMessage(
              "Transaction Confirmed!",
              receipt.transactionHash
            );
          }
          setTimeout(() => {
            this.props.clearMessage();
          }, 5000);
        })
        .on("error", (err, receipt) => {
          this.props.setMessage(
            "Transaction Failed.",
            receipt ? receipt.transactionHash : null
          );
        });
    } else if (this.proposalStateMap[this.props.status] === "Queued") {
      this.props.contract.methods
        .execute(this.props.id)
        .send({ from: this.props.account }, (err, transactionHash) => {
          this.props.setMessage("Transaction Pending...", transactionHash);
        })
        .on("confirmation", (number, receipt) => {
          if (number === 0) {
            this.props.setMessage(
              "Transaction Confirmed!",
              receipt.transactionHash
            );
          }
          setTimeout(() => {
            this.props.clearMessage();
          }, 5000);
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

    if (
      this.props.account &&
      this.props.end > this.props.latestBlock &&
      this.props.votingPower > 0
    ) {
      arrows = (
        <div className="proposal__arrows">
          <img
            src={upvote}
            alt="Vote for"
            className="proposal__arrow"
            onClick={this.handleVoteFor}
          />
          <img
            src={downvote}
            alt="Vote against"
            className="proposal__arrow"
            onClick={this.handleVoteAgainst}
          />
        </div>
      );
    }

    return (
      <div className="proposal">
        <h4 className="proposal__title">{this.props.title}</h4>
        <div className="proposal__info">
          <p className="proposal__votes">
            {"In Favour: "} {this.props.infavor}
            <br />
            {"Against: "} {this.props.against}
            <br />
            {"Expiry Block: "} {this.props.endBlock}
            <br />
            {"Expiry Time: "} {this.props.endDate}
            <br />
            {"Status: "} {this.proposalStateMap[this.props.status]}
          </p>
        </div>
        <div className="proposal__bottom">
          {arrows}
          <p className="proposal__description">{this.props.description}</p>
        </div>
        {this.proposalStateMap[this.props.status] === "Succeeded" ? (
          <Button
            label="Add Proposal to Queue"
            handleClick={this.handleProgressState}
          ></Button>
        ) : null}
        {this.proposalStateMap[this.props.status] === "Queued" ? (
          <Button
            label="Execute Proposal"
            handleClick={this.handleProgressState}
          ></Button>
        ) : null}
      </div>
    );
  }
}

export default Proposal;
