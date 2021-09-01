import React, { Component } from "react";

import "../layout/components/createproposalform.sass";
import { Form, FloatingLabel } from "react-bootstrap";
import contract from "../contracts/GovernorAlpha.json";

class CreateProposalForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      toAddress: "",
      daiAmount: 0,
      description: "",
    };
  }

  createProposal = async (receiverAddress, amount, description) => {
    console.log("Creator Address: ", this.props.account);
    console.log("Creating payment for: ", receiverAddress);
    console.log("of amount: ", amount);
    console.log("Decription: ", description);

    if (this.props.network === "Matic") {
      const governAddress = contract.networks[137]["address"];
      const governContract = new this.props.web3.eth.Contract(
        contract.abi,
        governAddress
      );

      //0x
      const forwardSigConst =
        contract["contractAddresses"]["forwarder"]["forwardSig"].slice(2); // forwardSig
      const daiAddressConst =
        "000000000000000000000000" +
        contract["contractAddresses"]["dai"]["address"].slice(2); // Dai Address
      const unknown1 =
        "0000000000000000000000000000000000000000000000000000000000000060"; // ? const (Remains constant in tests)
      const optionalPayableAmount =
        "0000000000000000000000000000000000000000000000000000000000000000"; // ? const (payable amount paramter. keep zero)
      const parametersSize =
        "0000000000000000000000000000000000000000000000000000000000000044"; // ? const (Seems to have to do with the amount of paramter bytes. Should be 0x44 for dai transfers)
      const transferSigConst =
        contract["contractAddresses"]["dai"]["transferSig"].slice(2); // transferSigConst
      const unknown4 =
        "00000000000000000000000000000000000000000000000000000000"; // ? const

      let callDatasDynamic = [
        "0x" +
          forwardSigConst +
          daiAddressConst +
          unknown1 +
          optionalPayableAmount +
          parametersSize +
          transferSigConst +
          "000000000000000000000000" +
          receiverAddress.slice(2).toLowerCase() +
          parseInt(this.props.web3.utils.toWei(amount))
            .toString(16)
            .padStart(64, "0") +
          unknown4,
      ];
      // Propose Parameters:
      // targets: ["forwarderAddress"]
      // values: [0]
      // signatures: [""]
      // calldatas: ["forwarder calldata"]
      // description: "Description"

      let targets = [contract.contractAddresses["forwarder"]["address"]];
      let values = [0];
      let signatures = [""];

      console.log("targets: ", targets);
      console.log("values: ", values);
      console.log("signatures: ", signatures);
      console.log("callDatasD: ", callDatasDynamic);
      console.log("description: ", description);

      try {
        governContract.methods
          .propose(targets, values, signatures, callDatasDynamic, description)
          .send({ from: this.props.account }, (err, transactionHash) => {
            this.props.setMessage("Transaction Pending...", transactionHash);
            console.log("Transaction Pending...", transactionHash);
          })
          .on("confirmation", (number, receipt) => {
            if (number === 0) {
              this.props.setMessage(
                "Transaction Confirmed!",
                receipt.transactionHash
              );
              console.log("Transaction Confirmed!", receipt.transactionHash);
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
            console.log("Transaction Failed!");
          });
      } catch (error) {
        console.error("Error in create proposal method: ", error);
      }
    }
  };

  handleAddressChange = async (evt) => {
    this.setState({
      toAddress: evt.target.value,
    });
    console.log(this.state.toAddress);
  };

  handleAmountChange = async (evt) => {
    this.setState({
      daiAmount: evt.target.value,
    });
    console.log(this.state.daiAmount);
  };

  handleDescriptionChange = async (evt) => {
    this.setState({
      description: evt.target.value,
    });
    console.log(this.state.description);
  };

  render() {
    return (
      <section className="form">
        <h4 className="title">Create a Payment Proposal</h4>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            this.createProposal(
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
              value={this.state.value}
              onChange={this.handleAddressChange}
              style={{ width: "400px" }}
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
              value={this.state.value}
              onChange={this.handleAmountChange}
              style={{ width: "400px" }}
            />
          </label>
          <br />
          <br />
          <FloatingLabel controlId="floatingTextarea2" label="Description">
            <Form.Control
              required
              as="textarea"
              placeholder="Describe the payment proposal"
              style={{ height: "200px" }}
              onChange={this.handleDescriptionChange}
            />
          </FloatingLabel>
          <br />
          <input
            disabled={!this.props.connected}
            type="submit"
            value="Create Proposal"
            style={{ width: "400px" }}
          />
        </form>
      </section>
    );
  }
}

export default CreateProposalForm;
