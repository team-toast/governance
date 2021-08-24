import React, { Component } from "react";

import "../layout/components/createproposalform.sass";
import { Button } from "react-bootstrap";
class CreateProposalForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      toAddress: "",
      daiAmount: 0,
    };
  }

  createProposal = (receiverAddress) => {
    console.log("Creating payment for: ", receiverAddress);
  };

  handleChange = async (evt) => {
    this.setState({
      toAddress: evt.target.value,
    });
    console.log(this.state.toAddress);
  };

  render() {
    return (
      <section className="form">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            let receiverAddress = this.toAddress;
            this.createProposal(this.state.toAddress);
          }}
        >
          <label>
            Name:
            <input
              required
              type="text"
              value={this.state.value}
              onChange={this.handleChange}
            />
          </label>
          <input type="submit" value="Submit" />
        </form>
      </section>
    );
  }
}

export default CreateProposalForm;
