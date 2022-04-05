import React, { Component } from "react";
import "../layout/components/tokenactions.sass";
import PopupHint from "./PopupHint";

import governatorContract from "../contracts/Governator.json";
import compTokenContract from "../contracts/Comp.json";
import contract from "../contracts/GovernorAlpha.json";
import appConfig from "../app-config.json";

class TokenActions extends Component {
    constructor(props) {
        super(props);

        this.state = {
            uintMaxHex:
                "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            uintMaxInt:
                "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            levrConvertAmount: 0,
            gLevrConvertAmount: 0,
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

    levrToGlevr = async () => {
        this.props.setProgress([]);
        try {
            let gasPrice = await this.props.getGasPrice();

            console.log("Converting LEVR to gLEVR");

            const levrToken = new this.props.web3.eth.Contract(
                compTokenContract,
                appConfig["contractAddresses"]["projectToken"]
            );

            // Check allowance
            let levrAllowance = await levrToken.methods
                .allowance(
                    this.props.account,
                    appConfig["contractAddresses"]["governator"]
                )
                .call();

            if (levrAllowance.length !== this.state.uintMaxInt.length) {
                // Approve
                this.props.setProgress([1]);
                this.props.setStatus("Converting LEVR to gLEVR", true);

                await levrToken.methods
                    .approve(
                        appConfig["contractAddresses"]["governator"],
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
            this.props.setStatus("Converting LEVR to gLEVR", true);
            const governator = new this.props.web3.eth.Contract(
                governatorContract,
                appConfig["contractAddresses"]["governator"]
            );
            await governator.methods
                .governate(
                    this.props.web3.utils.toWei(
                        parseFloat(this.state.levrConvertAmount).toString()
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
                        this.interpretEventAndUpdateLevrToGLevr(receipt);
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

    interpretEventAndUpdateLevrToGLevr = async (receipt) => {
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
                        appConfig["contractAddresses"][
                            "governanceToken"
                        ].toLowerCase() &&
                    tmpAccount.toLowerCase() ===
                        this.props.account.toLowerCase()
                ) {
                    this.props.levrGlevrMod(-1 * tmpAmount, tmpAmount);
                }
            }
        }
    };

    gLevrToLevr = async () => {
        this.props.setProgress([]);
        try {
            let gasPrice = await this.props.getGasPrice();

            // Convert
            // this.props.setStatus("Degovernating ...", true);
            this.props.setStatus("Converting gLEVR to LEVR", true);
            const governator = new this.props.web3.eth.Contract(
                governatorContract,
                appConfig["contractAddresses"]["governator"]
            );
            await governator.methods
                .degovernate(
                    this.props.web3.utils.toWei(
                        parseFloat(this.state.gLevrConvertAmount).toString()
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
                        this.interpretEventAndUpdateGLevrToLevr(receipt);
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

    interpretEventAndUpdateGLevrToLevr = async (receipt) => {
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
                        appConfig["contractAddresses"][
                            "governanceToken"
                        ].toLowerCase() &&
                    tmpAccount.toLowerCase() ===
                        this.props.account.toLowerCase()
                ) {
                    this.props.levrGlevrMod(tmpAmount, -1 * tmpAmount);
                    break;
                }
            }
        }
    };

    updateLevrAmount = async (evt) => {
        this.setState({
            levrConvertAmount: evt.target.value,
        });
    };

    updateGLevrAmount = async (evt) => {
        this.setState({
            gLevrConvertAmount: evt.target.value,
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
                                    {appConfig["projectTokenName"]} Balance
                                    <div className="value-display">
                                        {this.props.levrBalance}
                                    </div>
                                </div>
                                {/* Has LEVR */}
                                <div className="flex-actions">
                                    <div
                                        className={
                                            this.props.levrBalance !== "0"
                                                ? "flex-input"
                                                : "inactive flex-input"
                                        }
                                        data-title={
                                            "Your " +
                                            appConfig["projectTokenName"] +
                                            " balance is 0 and therefor you can't use this function."
                                        }
                                    >
                                        <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            onChange={this.updateLevrAmount}
                                            placeholder={
                                                "Amount of " +
                                                appConfig["projectTokenName"]
                                            }
                                        />
                                        <button
                                            className={
                                                this.state.levrConvertAmount ===
                                                    0 ||
                                                this.state.levrConvertAmount ===
                                                    ""
                                                    ? "disabled width-basis"
                                                    : "width-basis"
                                            }
                                            onClick={() =>
                                                this.toggleModal(
                                                    this.state.modal,
                                                    this.levrToGlevr,
                                                    "converting",
                                                    `You are about to convert <span>${this.props.numberWithCommas(
                                                        parseFloat(
                                                            this.state
                                                                .levrConvertAmount
                                                        ).toFixed(2)
                                                    )} ${
                                                        appConfig[
                                                            "projectTokenName"
                                                        ]
                                                    }</span> to <span>${this.props.numberWithCommas(
                                                        parseFloat(
                                                            this.state
                                                                .levrConvertAmount
                                                        ).toFixed(2)
                                                    )} ${
                                                        appConfig[
                                                            "governanceTokenName"
                                                        ]
                                                    }</span>`
                                                )
                                            }
                                        >
                                            {appConfig["governanceTokenName"]}{" "}
                                            {">"}
                                            {appConfig["projectTokenName"]}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="margin-top-1">
                                <div className="inner-box">
                                    {appConfig["governanceTokenName"]} Balance{" "}
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
                                        data-title={
                                            "Your " +
                                            appConfig["governanceTokenName"] +
                                            " balance is 0 and therefor you can't use this function."
                                        }
                                    >
                                        <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            onChange={this.updateGLevrAmount}
                                            placeholder={
                                                "Amount of " +
                                                appConfig["governanceTokenName"]
                                            }
                                        />
                                        <button
                                            className={
                                                this.state
                                                    .gLevrConvertAmount === 0 ||
                                                this.state
                                                    .gLevrConvertAmount === ""
                                                    ? "disabled width-basis"
                                                    : "width-basis"
                                            }
                                            onClick={() =>
                                                this.toggleModal(
                                                    this.state.modal,
                                                    this.gLevrToLevr,
                                                    "converting",
                                                    `You are about to convert <span>${this.props.numberWithCommas(
                                                        parseFloat(
                                                            this.state
                                                                .gLevrConvertAmount
                                                        ).toFixed(2)
                                                    )} gLEVR</span> to <span>${this.props.numberWithCommas(
                                                        parseFloat(
                                                            this.state
                                                                .gLevrConvertAmount
                                                        ).toFixed(2)
                                                    )} ${
                                                        appConfig[
                                                            "projectTokenName"
                                                        ]
                                                    }</span>`
                                                )
                                            }
                                        >
                                            {appConfig["governanceTokenName"]}{" "}
                                            {">"}
                                            {appConfig["projectTokenName"]}
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
                                    {/* Has gLevr */}
                                    <div
                                        className={
                                            this.props.balance !== "0"
                                                ? "flex-input"
                                                : "inactive flex-input"
                                        }
                                        data-title={
                                            "Your " +
                                            appConfig["governanceTokenName"] +
                                            " balance is 0 and therefor you can't use this function."
                                        }
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
                        {/* No Levr or gLevr */}
                        {this.props.levrBalance === "0" &&
                            this.props.balance === "0" && (
                                <div>
                                    <h3 className="sectionHeader text-center">
                                        {"You need " +
                                            appConfig["projectTokenName"] +
                                            " tokens to use this app."}
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
