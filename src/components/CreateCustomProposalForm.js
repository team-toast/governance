import React from "react";
import "../layout/components/createcustomproposal.sass";
import { Form, FloatingLabel } from "react-bootstrap";
import governorABI from "../contracts/GovernorAlpha.json";

class CreateCustomProposalForm extends React.Component {
  constructor() {
    super();
    this.state = {
      target: "",
      callData: "",
      methodCalls: [{ target: "", callData: "" }],
      description: "",
    };
  }

  createCustomProposalUsingABI = async () => {
    let callDataArray = [];
    let methodCallsArray = [];
    let values = [];
    let signatures = [];
    for (let i = 0; i < this.state.methodCalls.length; i++) {
      methodCallsArray.push(this.state.methodCalls[i]["target"]);
      callDataArray.push(this.state.methodCalls[i]["callData"]);
      values.push(0);
      signatures.push("");
    }

    console.log("Method call arrays: ");
    console.log(methodCallsArray);
    console.log(callDataArray);

    console.log("Decription: ", this.state.description);

    if (this.props.network === "Matic") {
      const governAddress = governorABI.networks[137]["address"];
      const governContract = new this.props.web3.eth.Contract(
        governorABI.abi,
        governAddress
      );

      try {
        governContract.methods
          .propose(
            methodCallsArray,
            values,
            signatures,
            callDataArray,
            this.state.description
          )
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

  handleEntryNameChange = (idx) => (evt) => {
    const newmethodCalls = this.state.methodCalls.map((entry, sidx) => {
      if (idx !== sidx) return entry;
      return { ...entry, target: evt.target.value };
    });

    this.setState({ methodCalls: newmethodCalls });
  };

  handleCallChange = (idx) => (evt) => {
    const newmethodCalls = this.state.methodCalls.map((entry, sidx) => {
      if (idx !== sidx) return entry;
      return { ...entry, callData: evt.target.value };
    });

    this.setState({ methodCalls: newmethodCalls });
  };

  handleSubmit = (evt) => {
    this.createCustomProposalUsingABI();
  };

  handleAddEntry = () => {
    this.setState({
      methodCalls: this.state.methodCalls.concat([
        { target: "", callData: "" },
      ]),
    });
  };

  handleRemoveEntry = (idx) => () => {
    this.setState({
      methodCalls: this.state.methodCalls.filter((s, sidx) => idx !== sidx),
    });
  };

  handleDescriptionChange = async (evt) => {
    this.setState({
      description: evt.target.value,
    });
    console.log(this.state.description);
  };

  render() {
    return (
      <section>
        <form
          onSubmit={(e) => {
            e.preventDefault();

            this.handleSubmit();
          }}
        >
          <h4 className="title">Create a Custom Proposal</h4>
          {/* ... */}

          {this.state.methodCalls.map((entry, idx) => (
            <div className="entry">
              <input
                required
                type="text"
                placeholder={`Target Contract Address #${idx + 1}`}
                value={entry.target}
                onChange={this.handleEntryNameChange(idx)}
                className="target"
              />
              <input
                required
                type="text"
                placeholder={`Call Data #${idx + 1}`}
                value={entry.callData}
                onChange={this.handleCallChange(idx)}
                className="calldata"
              />
              <button
                type="button"
                onClick={this.handleRemoveEntry(idx)}
                className="remove"
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={this.handleAddEntry} className="small">
            Add Contract Call
          </button>
          <br />
          <br />
          <br />
          <FloatingLabel controlId="floatingTextarea2" label="Description">
            <Form.Control
              required
              as="textarea"
              placeholder="Describe the payment proposal"
              style={{ height: "150px" }}
              onChange={this.handleDescriptionChange}
            />
          </FloatingLabel>
          <br />
          <button className="medium">Create Proposal</button>
          <br />
          <br />
          <br />
        </form>
      </section>
    );
  }
}
export default CreateCustomProposalForm;