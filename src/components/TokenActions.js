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
            modal: false,
            callFunction: null,
            processtype: "",
            processMessage: "",
        };
    }

    toggleModal = (data, callFunction, processtype, processMessage) => {
        this.setState({ modal: !data });
        this.setState({ callFunction });
        this.setState({ processtype });
        this.setState({ processMessage });
    };

    fryToGfry = async () => {
        this.props.setProgress([]);
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
                            console.log(
                                "Transaction Pending...",
                                transactionHash
                            );
                        }
                    )
                    .on("confirmation", (number, receipt) => {
                        if (number === 1) {
                            console.log(
                                "Transaction Confirmed!",
                                receipt.transactionHash
                            );
                            this.props.setProgress([1, 2, 3]);
                            //this.readDelegateEvents(receipt);
                            // this.props.setStatus("Transaction Confirmed!", true);
                        }
                    })
                    .on("error", (err, receipt) => {
                        // this.props.setStatus("Could not approve. Please try again.", true);
                        this.props.setProgress([1, 2, 3, 4]);
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
                    if (number === 1) {
                        console.log("Transaction Confirmed!", receipt);
                        this.props.setProgress([1, 2, 3]);
                        this.interpretEventAndUpdateFryToGFry(receipt);
                        // this.props.setStatus("Transaction Confirmed!", true);
                    }
                })
                .on("error", (err, receipt) => {
                    // this.props.setStatus("Could not governate. Please try again.", true);
                    this.props.setProgress([1, 2, 3, 4]);
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
                tmpAmount = parseFloat(
                    this.props.web3.utils.fromWei(tmpAmount)
                );

                if (
                    tmpAddress.toLowerCase() ===
                        contract.contractAddresses["token"][
                            "address"
                        ].toLowerCase() &&
                    tmpAccount.toLowerCase() ===
                        this.props.account.toLowerCase()
                ) {
                    this.props.fryGfryMod(-1 * tmpAmount, tmpAmount);
                }
            }
        }
    };

    gFryToFry = async () => {
        this.props.setProgress([]);
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
                        this.props.setProgress([1, 2]);
                        // this.props.setStatus("Transaction Pending ...", true);
                        console.log("Transaction Pending...", transactionHash);
                    }
                )
                .on("confirmation", (number, receipt) => {
                    if (number === 1) {
                        console.log("Transaction Confirmed!", receipt);
                        this.interpretEventAndUpdateGFryToFry(receipt);
                        this.props.setProgress([1, 2, 3]);
                        // this.props.setStatus("Transaction Confirmed!", true);
                    }
                })
                .on("error", (err, receipt) => {
                    // this.props.setStatus(
                    //   "Could not degovernate. Please try again.",
                    //   true
                    // );
                    this.props.setProgress([1, 2, 3, 4]);
                    console.log("Transaction Failed!");
                });

            console.log("Degovernate Successful");
        } catch (error) {
            console.log(error);
        }
    };

    interpretEventAndUpdateGFryToFry = async (receipt) => {
        for (var key of Object.keys(receipt.events)) {
            //console.log("In for loop");
            if (
                receipt.events[key].address &&
                receipt.events[key].raw.data &&
                receipt.events[key].raw.topics[1]
            ) {
                let tmpAddress = receipt.events[key].address;
                let tmpAmount = receipt.events[key].raw.data;
                let tmpAccount = receipt.events[key].raw.topics[1];
                tmpAccount = "0x" + tmpAccount.substring(26);
                tmpAmount = parseFloat(
                    this.props.web3.utils.fromWei(tmpAmount)
                );

                if (
                    tmpAddress.toLowerCase() ===
                        contract.contractAddresses["token"][
                            "address"
                        ].toLowerCase() &&
                    tmpAccount.toLowerCase() ===
                        this.props.account.toLowerCase()
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

    renderFunction = () => {
        this.setState({ modal: false });
        this.state.callFunction();
    };

    render() {
        return (
            this.props.delegatedAddress !== "Unknown" && (
                <div className="actionsSection">
                    {this.state.modal && (
                        <div className="modal-question">
                            <div className="content">
                                <img src="/Converting.svg" />
                                <div className="action-message">
                                    {this.state.processtype}
                                </div>
                                <h2>Proceed?</h2>
                                <p
                                    dangerouslySetInnerHTML={{
                                        __html: this.state.processMessage,
                                    }}
                                ></p>
                                <div>
                                    <button onClick={this.renderFunction}>
                                        Confirm
                                    </button>
                                    <button
                                        className="second"
                                        onClick={this.toggleModal}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="action">
                        <div className="flex xs-xs-noflex">
                            <div className="margin-top-1">
                                <div className="inner-box">
                                    FRY Balance
                                    <div className="value-display">
                                        {this.props.fryBalance}
                                    </div>
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
                                        <button
                                            className={
                                                this.state.fryConvertAmount ===
                                                    0 ||
                                                this.state.fryConvertAmount ===
                                                    ""
                                                    ? "disabled width-basis"
                                                    : "width-basis"
                                            }
                                            onClick={() =>
                                                this.toggleModal(
                                                    this.state.modal,
                                                    this.fryToGfry,
                                                    "converting",
                                                    `You are about to convert <span>${this.props.numberWithCommas(
                                                        parseFloat(
                                                            this.state
                                                                .fryConvertAmount
                                                        ).toFixed(2)
                                                    )} FRY</span> to <span>${this.props.numberWithCommas(
                                                        parseFloat(
                                                            this.state
                                                                .fryConvertAmount
                                                        ).toFixed(2)
                                                    )} gFRY</span>`
                                                )
                                            }
                                        >
                                            FRY {">"} gFRY
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="margin-top-1">
                                <div className="inner-box">
                                    gFRY Balance{" "}
                                    <div className="value-display">
                                        {this.props.balance}
                                    </div>
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
                                        <button
                                            className={
                                                this.state.gFryConvertAmount ===
                                                    0 ||
                                                this.state.gFryConvertAmount ===
                                                    ""
                                                    ? "disabled width-basis"
                                                    : "width-basis"
                                            }
                                            onClick={() =>
                                                this.toggleModal(
                                                    this.state.modal,
                                                    this.gFryToFry,
                                                    "converting",
                                                    `You are about to convert <span>${this.props.numberWithCommas(
                                                        parseFloat(
                                                            this.state
                                                                .gFryConvertAmount
                                                        ).toFixed(2)
                                                    )} gFRY</span> to <span>${this.props.numberWithCommas(
                                                        parseFloat(
                                                            this.state
                                                                .gFryConvertAmount
                                                        ).toFixed(2)
                                                    )} FRY</span>`
                                                )
                                            }
                                        >
                                            gFRY {">"} FRY
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="margin-top-1">
                                <div className="inner-box">
                                    Voting Power
                                    <div className="value-display">
                                        {this.props.numberWithCommas(
                                            (
                                                parseInt(
                                                    this.props.votingPower
                                                ) /
                                                10 ** 18
                                            ).toFixed(2)
                                        )}
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
                                            onChange={
                                                this.props
                                                    .updateDelegateeAddress
                                            }
                                            placeholder="0x... Address to Delegate to"
                                        />
                                        <PopupHint
                                            classToBeUsed={
                                                this.props.convertedAddress ===
                                                ""
                                                    ? "disabled width-basis"
                                                    : "width-basis"
                                            }
                                            message={
                                                this.props.balance === "0.00"
                                                    ? "You don't have governance tokens"
                                                    : ""
                                            }
                                        >
                                            <button
                                                onClick={() =>
                                                    this.toggleModal(
                                                        this.state.modal,
                                                        this.props.delegate,
                                                        "delegating",
                                                        `You are delegating voting power to address <span>${this.props.convertedAddress}</span>`
                                                    )
                                                }
                                            >
                                                Delegate
                                            </button>
                                        </PopupHint>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* No Fry or gFry */}
                        {this.props.fryBalance === "0" &&
                            this.props.balance === "0" && (
                                <div>
                                    <h3 className="sectionHeader text-center">
                                        You need FRY tokens to use this app.
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
