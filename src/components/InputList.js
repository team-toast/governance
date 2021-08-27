import React from "react";
import "../layout/components/createcustomproposal.sass";
import { Form, FloatingLabel } from "react-bootstrap";

class IncorporationForm extends React.Component {
  constructor() {
    super();
    this.state = {
      name: "",
      callData: "",
      shareholders: [{ name: "", callData: "" }],
      description: "",
    };
  }

  handleShareholderNameChange = (idx) => (evt) => {
    const newShareholders = this.state.shareholders.map((shareholder, sidx) => {
      if (idx !== sidx) return shareholder;
      return { ...shareholder, name: evt.target.value };
    });

    this.setState({ shareholders: newShareholders });
  };

  handleCallChange = (idx) => (evt) => {
    const newShareholders = this.state.shareholders.map((shareholder, sidx) => {
      if (idx !== sidx) return shareholder;
      return { ...shareholder, callData: evt.target.value };
    });

    this.setState({ shareholders: newShareholders });
  };

  handleSubmit = (evt) => {
    const { name, shareholders } = this.state;
    let data = "";
    for (let i = 0; i < shareholders.length; i++) {
      console.log("Name: ", shareholders[i]["name"]);
      console.log("call: ", shareholders[i]["callData"]);
    }
  };

  handleAddShareholder = () => {
    this.setState({
      shareholders: this.state.shareholders.concat([
        { name: "", callData: "" },
      ]),
    });
  };

  handleRemoveShareholder = (idx) => () => {
    this.setState({
      shareholders: this.state.shareholders.filter((s, sidx) => idx !== sidx),
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

          {this.state.shareholders.map((shareholder, idx) => (
            <div className="shareholder">
              <input
                type="text"
                placeholder={`Target Contract #${idx + 1}`}
                value={shareholder.name}
                onChange={this.handleShareholderNameChange(idx)}
                className="target"
              />
              <input
                type="text"
                placeholder={`CallData #${idx + 1}`}
                value={shareholder.callData}
                onChange={this.handleCallChange(idx)}
                className="calldata"
              />
              <button
                type="button"
                onClick={this.handleRemoveShareholder(idx)}
                className="remove"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={this.handleAddShareholder}
            className="small"
          >
            Add Method Call
          </button>
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
        </form>
      </section>
    );
  }
}
export default IncorporationForm;
