import React, { Component } from "react";

import "../layout/components/createproposalform.sass";
import { Form, FloatingLabel } from "react-bootstrap";
import governorABI from "../contracts/GovernorAlpha.json";
import Forwarder from "../contracts/Forwarder.json";
import Dai from "../contracts/Dai.json";

import PopupHint from "./PopupHint";

class CreateProposalForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            toAddress: "",
            daiAmount: 0,
            description: "",
        };
    }

    createProposalUsingABI = async (receiverAddress, amount, description) => {
        console.log("Creator Address: ", this.props.account);
        console.log("Creating payment for: ", receiverAddress);
        console.log("of amount: ", amount);
        console.log("Decription: ", description);

        // this.props.setStatusOf("Creating proposal ...", true);

        if (this.props.network === "Arbitrum") {
            const governAddress = governorABI.networks[42161]["address"];
            const governContract = new this.props.web3.eth.Contract(
                governorABI.abi,
                governAddress
            );

            const daiFuncCall = this.props.web3.eth.abi.encodeFunctionCall(
                Dai.find((el) => el.name === "transfer"),
                [
                    receiverAddress,
                    this.props.web3.utils.toWei(amount).toString(16),
                ]
            );

            const forwardFuncCall = this.props.web3.eth.abi.encodeFunctionCall(
                Forwarder.find((el) => el.name === "forward"),
                [
                    governorABI.contractAddresses["dai"]["address"],
                    daiFuncCall,
                    "0",
                ]
            );

            let callDatasDynamic = [forwardFuncCall];

            let targets = [
                governorABI.contractAddresses["forwarder"]["address"],
            ];
            let values = [0];
            let signatures = [""];

            console.log("CALLDATA", callDatasDynamic[0]);

            try {
                this.props.contract.methods
                    .propose(
                        targets,
                        values,
                        signatures,
                        callDatasDynamic,
                        description
                    )
                    .estimateGas(
                        {
                            from: this.props.account,
                        },
                        function (error, result) {
                            if (error) {
                                alert(error);
                            }
                        }
                    );

                const gasPrice = await this.props.getGasPrice();
                governContract.methods
                    .propose(
                        targets,
                        values,
                        signatures,
                        callDatasDynamic,
                        description
                    )
                    .send(
                        { from: this.props.account, gasPrice: gasPrice },
                        (err, transactionHash) => {
                            this.props.setMessage(
                                "Transaction Pending...",
                                transactionHash
                            );
                            console.log(
                                "Transaction Pending...",
                                transactionHash
                            );
                            // this.props.setStatusOf("Transaction Pending ...", true);
                        }
                    )
                    .on("confirmation", (number, receipt) => {
                        if (number === 1) {
                            this.props.setMessage(
                                "Transaction Confirmed!",
                                receipt.transactionHash
                            );
                            // this.props.setStatusOf("Transaction Confirmed!", true);
                            console.log(
                                "Transaction Confirmed!",
                                receipt.transactionHash
                            );
                        }
                        this.props.getLatestBlock();
                        setTimeout(() => {
                            this.props.clearMessage();
                        }, 5000);
                    })
                    .on("error", (err, receipt) => {
                        this.props.setMessage(
                            "Transaction Failed.",
                            receipt ? receipt.transactionHash : null
                        );
                        // this.props.setStatusOf(
                        //   "Transaction Failed! Please try again.",
                        //   true
                        // );
                        console.log("Transaction Failed!");
                    });
            } catch (error) {
                // this.props.setStatusOf("Transaction Failed! Please try again.", true);
                console.error("Error in create proposal method: ", error);
            }
        }
    };

    handleAddressChange = async (evt) => {
        this.setState({
            toAddress: evt.target.value,
        });
    };

    handleAmountChange = async (evt) => {
        this.setState({
            daiAmount: evt.target.value,
        });
    };

    handleDescriptionChange = async (evt) => {
        this.setState({
            description: evt.target.value,
        });
    };

    render() {
        return (
            <section className="form">
                <h4 className="title">
                    Treasury Balance: {this.props.treasuryBalance} Dai
                </h4>
                <br />
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        this.createProposalUsingABI(
                            this.state.toAddress,
                            this.state.daiAmount,
                            this.state.description
                        );
                    }}
                >
                    <label>
                        Recipient Address: <br />
                        <input
                            required
                            type="text"
                            placeholder="0x..."
                            value={this.state.value}
                            onChange={this.handleAddressChange}
                        />
                    </label>
                    <br />
                    <br />
                    <label>
                        Dai Amount: <br />
                        <input
                            required
                            type="number"
                            step="0.01"
                            placeholder="1"
                            value={this.state.value}
                            onChange={this.handleAmountChange}
                        />
                    </label>
                    <br />
                    <br />
                    <label>
                        Description: <br />
                        <FloatingLabel controlId="floatingTextarea2">
                            <Form.Control
                                required
                                as="textarea"
                                placeholder="Describe the payment proposal"
                                style={{ height: "200px" }}
                                onChange={this.handleDescriptionChange}
                            />
                        </FloatingLabel>
                    </label>
                    <br />
                    <br />
                    <div className="center_div">
                        <PopupHint message={this.props.disableMessage}>
                            <input
                                disabled={
                                    !this.props.connected ||
                                    this.props.disableButtons
                                }
                                className="dai_proposal_button"
                                type="submit"
                                value="Create Proposal"
                            />
                        </PopupHint>
                    </div>
                </form>
            </section>
        );
    }
}

export default CreateProposalForm;
