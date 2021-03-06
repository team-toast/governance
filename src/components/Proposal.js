import React, { Component } from "react";

//import upvote from "../images/upvote.svg";
//import downvote from "../images/downvote.svg";

import "../layout/components/proposals.sass";
import PopupHint from "./PopupHint";

class Proposal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showBody: true,
            showData: false,
        };
    }
    toggleShowBody = () => {
        this.setState({ showBody: true });
    };
    toggleShowData = () => {
        this.setState({ showData: true });
    };
    handleVoteFor = async () => {
        // this.props.setStatusOf("Voting In Favour ...", true);
        const gasPrice = await this.props.getGasPrice();

        this.estimateGas("voteFor");

        this.props.contract.methods
            .castVote(this.props.id, true)
            .send(
                { from: this.props.account, gasPrice: gasPrice },
                (err, transactionHash) => {
                    this.props.setMessage(
                        "Transaction Pending...",
                        transactionHash
                    );
                    // this.props.setStatusOf("Voting Pending ...", true);
                    // this.props.setProgress([1, 2]);
                }
            )
            .on("confirmation", (number, receipt) => {
                if (number === 1) {
                    this.props.setMessage(
                        "Transaction Confirmed!",
                        receipt.transactionHash
                    );
                    // this.props.setStatusOf("Voted Successfully!", true);
                    // this.props.setProgress([1, 2, 3]);
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
                // this.props.setStatusOf(
                //     "Voting failed. Please try again.",
                //     true
                // );
                // this.props.setProgress([1, 2, 3, 4]);
            });
    };

    handleVoteAgainst = async () => {
        //this.props.setStatusOf("Voting Against ...", true);
        const gasPrice = await this.props.getGasPrice();

        this.estimateGas("voteAgainst");

        this.props.contract.methods
            .castVote(this.props.id, false)
            .send(
                { from: this.props.account, gasPrice: gasPrice },
                (err, transactionHash) => {
                    // this.props.setMessage(
                    //     "Transaction Pending...",
                    //     transactionHash
                    // );
                    // this.props.setStatusOf("Voting Pending ...", true);
                    // this.props.setProgress([1, 2]);
                }
            )
            .on("confirmation", (number, receipt) => {
                if (number === 1) {
                    this.props.setMessage(
                        "Transaction Confirmed!",
                        receipt.transactionHash
                    );
                    // this.props.setStatusOf("Voted Successfully!", true);
                    // this.props.setProgress([1, 2, 3]);
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
                // this.props.setStatusOf(
                //     "Voting failed. Please try again.",
                //     true
                // );
                // this.props.setProgress([1, 2, 3, 4]);
            });
    };

    handleProgressState = async () => {
        //succeeded can be queued state: 4, queued can be executed state: 5
        let gasPrice = await this.props.getGasPrice();
        if (this.props.status === "Succeeded") {
            // this.props.setStatusOf("Adding proposal to Queue ...", true);

            this.estimateGas("queue");

            this.props.contract.methods
                .queue(this.props.id)
                .send(
                    {
                        from: this.props.account,
                        gasPrice: gasPrice,
                    },
                    (err, transactionHash) => {
                        this.props.setMessage(
                            "Transaction Pending...",
                            transactionHash
                        );
                        // this.props.setStatusOf("Transaction Pending ...", true);
                        // this.props.setProgress([1, 2]);
                    }
                )
                .on("confirmation", (number, receipt) => {
                    if (number === 1) {
                        this.props.setMessage(
                            "Transaction Confirmed!",
                            receipt.transactionHash
                        );
                        // this.props.setStatusOf("Transaction Confirmed!", true);
                        // this.props.setProgress([1, 2, 3]);
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
                    // this.props.setStatusOf(
                    //     "Transaction failed! Please try again.",
                    //     true
                    // );
                    // this.props.setProgress([1, 2, 3, 4]);
                });
        } else if (this.props.status === "Queued") {
            // this.props.contract.methods.execute(this.props.id).estimateGas(
            //     {
            //         from: this.props.account,
            //         gasPrice: gasPrice,
            //     },
            //     function (error, result) {
            //         if (error) {
            //             if (
            //                 error.message.indexOf(
            //                     "Transaction hasn't surpassed time lock."
            //                 ) !== -1
            //             ) {
            //                 alert(
            //                     "This proposal has not surpassed the timelock period of two days. Execution will fail. Please try again later."
            //                 );
            //             } else {
            //                 alert(error);
            //             }
            //         }
            //     }
            // );
            this.estimateGas("execute");
            // this.props.setStatusOf("Executing proposal ...", true);
            this.props.contract.methods
                .execute(this.props.id)
                .send(
                    {
                        from: this.props.account,
                        gasPrice: gasPrice,
                    },
                    (err, transactionHash) => {
                        this.props.setMessage(
                            "Transaction Pending...",
                            transactionHash
                        );
                        // this.props.setStatusOf("Transaction Pending ...", true);
                        // this.props.setProgress([1, 2]);
                    }
                )
                .on("confirmation", (number, receipt) => {
                    if (number === 1) {
                        this.props.setMessage(
                            "Transaction Confirmed!",
                            receipt.transactionHash
                        );
                        // this.props.setStatusOf("Transaction Confirmed!", true);
                        // this.props.setProgress([1, 2, 3]);
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
                    // this.props.setStatusOf(
                    //     "Transaction Failed! Please try again.",
                    //     true
                    // );
                    // this.props.setProgress([1, 2, 3, 4]);
                });
        } else {
            console.log(
                "This proposal is not in the succeeded or queued states"
            );
        }
    };

    estimateGas = (method) => {
        if (method === "voteFor") {
            this.props.contract.methods
                .castVote(this.props.id, true)
                .estimateGas(
                    {
                        from: this.props.account,
                        //asPrice: gasPrice,
                    },
                    function (error, result) {
                        if (error) {
                            alert(error.message);
                            console.log("Error: ", error.message);
                        }
                    }
                );
        } else if (method === "voteAgainst") {
            this.props.contract.methods
                .castVote(this.props.id, false)
                .estimateGas(
                    {
                        from: this.props.account,
                        //gasPrice: gasPrice,
                    },
                    function (error, result) {
                        if (error) {
                            alert(error.message);
                            console.log("Error: ", error.message);
                        }
                    }
                );
        } else if (method === "queue") {
            this.props.contract.methods.queue(this.props.id).estimateGas(
                {
                    from: this.props.account,
                    //gasPrice: gasPrice,
                },
                function (error, result) {
                    if (error) {
                        alert(error.message);
                        console.log("Error: ", error.message);
                    }
                }
            );
        } else if (method === "execute") {
            this.props.contract.methods.execute(this.props.id).estimateGas(
                {
                    from: this.props.account,
                    //gasPrice: gasPrice,
                },
                function (error, result) {
                    if (error) {
                        if (
                            error.message.indexOf(
                                "Transaction hasn't surpassed time lock."
                            ) !== -1
                        ) {
                            console.log("Error: ", error.message);
                            alert(
                                "This proposal has not surpassed the timelock period of two days. Execution will fail. Please try again later."
                            );
                        } else {
                            alert(error);
                        }
                    }
                }
            );
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
                    <PopupHint
                        message={this.props.disableMessage}
                        position="left"
                    >
                        <button
                            className="vote__button against"
                            onClick={this.handleVoteAgainst}
                            disabled={
                                !this.props.connected ||
                                this.props.buttonsDisabled
                            }
                        >
                            Vote Against
                        </button>
                    </PopupHint>
                </div>
            );
            arrowsInFavour = (
                <div className="proposal__arrows">
                    <PopupHint
                        message={this.props.disableMessage}
                        position="left"
                    >
                        <button
                            className="vote__button"
                            onClick={this.handleVoteFor}
                            disabled={
                                !this.props.connected ||
                                this.props.buttonsDisabled
                            }
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
                        <span className="proposal__pill">
                            Start time:{" "}
                            {this.props.startDate
                                ? this.props.startDate
                                : "Loading..."}
                        </span>
                        <span className="proposal__block">
                            {this.props.startBlock}
                        </span>
                        <br></br>
                        <span className="proposal__pill">
                            End time: &nbsp;{" "}
                            {this.props.endDate
                                ? this.props.endDate
                                : "Loading..."}
                        </span>
                        <span className="proposal__block">
                            {this.props.endBlock}
                        </span>
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
                                    <span>{this.props.infavor}</span>
                                </h5>
                                <div className="bar-growth">
                                    <div style={infavorGrowth}></div>
                                </div>
                                {arrowsInFavour}
                            </div>
                            <div>
                                <h5>
                                    <span>Against</span>{" "}
                                    <span>{this.props.against}</span>
                                </h5>
                                <div className="bar-growth against">
                                    <div style={againstGrowth}></div>
                                </div>
                                {arrowsAgainst}
                            </div>
                        </div>
                        {this.props.isPayment[3].length > 1 && (
                            <div>
                                {(this.props.isPayment[0] === true &&
                                    this.props.isPayment[3]) === "Dai" ? (
                                    <div
                                        className={`payment__type payment-${this.props.isPayment[3]}`}
                                    >
                                        <div className="payment-text-area">
                                            <span className="payment-amount">
                                                {`Payment Proposal of ${this.props.isPayment[1].toString()} ${
                                                    this.props.isPayment[3]
                                                } to`}
                                            </span>
                                            <span className="payment-text-area">
                                                {`0x${this.props.isPayment[2].toString()}`}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={`payment__type payment-${this.props.isPayment[3]}`}
                                    >
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
                                )}
                            </div>
                        )}

                        {this.state.showBody && (
                            <div className="proposal__bottom">
                                <p className="proposal__description">
                                    {this.props.description
                                        ? this.props.description
                                        : "Loading..."}
                                </p>
                            </div>
                        )}
                        {this.props.isPayment[0] === false && (
                            <div>
                                {!this.state.showData &&
                                    this.props.isPayment[4] && (
                                        <div
                                            className="calldata-block__button"
                                            onClick={this.toggleShowData}
                                        >
                                            <h6>Show Call Data</h6>
                                        </div>
                                    )}

                                {this.state.showData && (
                                    <div
                                        className={`payment__type payment-${this.props.isPayment[3]}`}
                                    >
                                        <div>
                                            <span className="payment-text-area">
                                                <h6>Target(s): </h6> <br></br>
                                                {`${this.props.isPayment[4]} `}
                                                <br></br> <br></br>
                                                <h6>Call Data(s): </h6>{" "}
                                                <br></br>
                                                {` ${this.props.isPayment[5]} `}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div></div>
                            </div>
                        )}
                    </div>
                )}
                {this.props.status === "Succeeded" && this.state.showBody ? (
                    <PopupHint
                        message={this.props.disableMessage}
                        position="bottom"
                    >
                        <button
                            className="proposal__button"
                            variant="secondary"
                            onClick={this.handleProgressState}
                            disabled={
                                !this.props.connected ||
                                this.props.buttonsDisabled
                            }
                        >
                            Add Proposal to Queue
                        </button>
                    </PopupHint>
                ) : null}
                {this.props.status === "Queued" && this.state.showBody ? (
                    <PopupHint
                        message={this.props.disableMessage}
                        position="bottom"
                    >
                        <button
                            className="proposal__button"
                            variant="secondary"
                            onClick={this.handleProgressState}
                            disabled={
                                !this.props.connected ||
                                this.props.buttonsDisabled
                            }
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
