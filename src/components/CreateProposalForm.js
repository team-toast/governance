import React, { Component } from "react";

import "../layout/components/createproposalform.sass";
import { Form, FloatingLabel } from "react-bootstrap";
import governorABI from "../contracts/GovernorAlpha.json";
import appConfig from "../app-config.json";
import Forwarder from "../contracts/Forwarder.json";
import Dai from "../contracts/Dai.json";

import PopupHint from "./PopupHint";

class CreateProposalForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            toAddress: "",
            tokenAddress: appConfig["contractAddresses"]["projectToken"],
            tokenName: "",
            tokenSymbol: "",
            tokenBalance: "",
            tokenDecimals: "",
            tokenDetailsLoaded: false,
            tokenDetailsMessage: "",
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
            const governAddress =
                appConfig["contractAddresses"]["governorAlpha"];
            const governContract = new this.props.web3.eth.Contract(
                governorABI.abi,
                governAddress
            );

            const tokenFuncCall = this.props.web3.eth.abi.encodeFunctionCall(
                Dai.find((el) => el.name === "transfer"),
                [
                    receiverAddress,
                    this.props.web3.utils.toWei(amount).toString(16),
                ]
            );

            const forwardFuncCall = this.props.web3.eth.abi.encodeFunctionCall(
                Forwarder.find((el) => el.name === "forward"),
                [this.state.tokenAddress, tokenFuncCall, "0"]
            );

            let callDatasDynamic = [forwardFuncCall];

            let targets = [appConfig["contractAddresses"]["treasuryForwarder"]];
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

    getTokenDetails = async (address = this.state.tokenAddress) => {
        try {
            this.setState({
                tokenDetailsMessage: "Loading Token Info...",
            });
            const tokenInst = new this.props.web3.eth.Contract(Dai, address);
            let tokenName = await tokenInst.methods.name().call();
            let tokenBalance = await tokenInst.methods
                .balanceOf(appConfig["contractAddresses"]["treasuryForwarder"])
                .call();
            let tokenSymbol = await tokenInst.methods.symbol().call();
            let tokenDecimals = await tokenInst.methods.decimals().call();
            console.log("Token Name: ", tokenName);
            this.setState({
                tokenName: tokenName,
            });
            this.setState({
                tokenBalance: this.props.web3.utils.fromWei(tokenBalance),
            });
            this.setState({
                tokenSymbol: tokenSymbol,
            });
            this.setState({
                tokenDecimals: tokenDecimals,
            });
            this.setState({
                tokenDetailsLoaded: true,
            });
            this.setState({
                tokenDetailsMessage: "",
            });
        } catch (error) {
            console.error("Error getting token name: ", error);
            this.setState({
                tokenName: "",
            });
            this.setState({
                tokenDetailsMessage: "Could not find token details",
            });
        }
    };

    handleAddressChange = async (evt) => {
        this.setState({
            toAddress: evt.target.value,
        });
    };

    handleTokenAddressChange = async (evt) => {
        if (this.props.web3.utils.isAddress(evt.target.value.toLowerCase())) {
            console.log("Valid Address!:", evt.target.value);
            this.getTokenDetails(evt.target.value);
            this.setState({
                tokenAddress: evt.target.value,
            });
        } else {
            this.setState({
                tokenDetailsMessage: "Not a valid address.",
            });
        }
        console.log("Token Address: ", evt.target.value);
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

    componentDidMount() {
        this.getTokenDetails();
    }

    render() {
        return (
            <section className="form">
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
                        Token to Send: <br />
                        <input
                            required
                            type="text"
                            step="0.01"
                            placeholder="0x..."
                            defaultValue={
                                appConfig["contractAddresses"]["projectToken"]
                            }
                            value={this.state.value}
                            onChange={this.handleTokenAddressChange}
                        />
                    </label>
                    <br />
                    {this.state.tokenName && !this.state.tokenDetailsMessage ? (
                        <div className="token_details_div">
                            <p>Name: {this.state.tokenName}</p>
                            <p>Symbol: {this.state.tokenSymbol}</p>
                            <p>Treasury Balance: {this.state.tokenBalance}</p>
                            <p>Decimals: {this.state.tokenDecimals}</p>
                        </div>
                    ) : (
                        this.state.tokenDetailsLoaded && (
                            <p className="token_details_div">
                                {this.state.tokenDetailsMessage}
                            </p>
                        )
                    )}
                    <br />
                    <label>
                        Amount: <br />
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
