import React, { Component } from "react";
import "../layout/components/pager.sass";

class Pager extends Component {
  constructor(props) {
    super(props);

    this.state = {
      newerDisabled: true,
      olderDisabled: false,
    };
  }

  componentDidMount = () => {
    if (
      parseInt(this.props.numberOfProposals) -
        parseInt(this.props.bookmark) +
        parseInt(this.props.proposalsPerPage) ===
      parseInt(this.props.numberOfProposals)
    ) {
      this.setState({ newerDisabled: true });
    } else {
      this.setState({ newerDisabled: false });
    }

    if (
      parseInt(this.props.numberOfProposals) -
        parseInt(this.props.bookmark) -
        1 <
      0
    ) {
      this.setState({ olderDisabled: true });
    } else {
      this.setState({ olderDisabled: false });
    }
  };

  render() {
    return (
      <section className="pager-section">
        <section className="pager">
          <button
            className="pager__button"
            onClick={this.props.back}
            disabled={this.state.newerDisabled}
          >
            {"<"} Newer
          </button>
          <button className="pager__button" onClick={this.props.refresh}>
            Refresh
          </button>
          <button
            className="pager__button"
            onClick={this.props.next}
            disabled={this.state.olderDisabled}
          >
            Older {">"}
          </button>
        </section>
      </section>
    );
  }
}

export default Pager;
