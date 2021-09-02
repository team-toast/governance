import React, { Component } from "react";

import upvote from "../images/upvote.svg";
import downvote from "../images/downvote.svg";

import "../layout/components/proposals.sass";
//import Button from "./Button";
import { Button } from "react-bootstrap";

class Proposal extends Component {
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
          this.props.updateProposalStates();
        }, 10000);
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
          this.props.updateProposalStates();
        }, 10000);
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
    if (this.props.status === "Succeeded") {
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
            this.props.updateProposalStates();
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
            this.props.updateProposalStates();
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
          {arrows}
          <p className="proposal__description">{this.props.description}</p>
        </div>
        {this.props.status === "Succeeded" ? (
          <Button
            className="proposal__button"
            variant="secondary"
            onClick={this.handleProgressState}
            disabled={
              this.props.message === "Transaction Pending..." ||
              this.props.message === "Transaction Confirmed!"
            }
          >
            Add Proposal to Queue
          </Button>
        ) : null}
        {this.props.status === "Queued" ? (
          <Button
            className="proposal__button"
            variant="secondary"
            onClick={this.handleProgressState}
            disabled={
              this.props.message === "Transaction Pending..." ||
              this.props.message === "Transaction Confirmed!"
            }
          >
            Execute Proposal
          </Button>
        ) : null}
      </div>
    );
  }
}

export default Proposal;
