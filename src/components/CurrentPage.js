import React, { Component } from "react";
import "../layout/components/pager.sass";

class CurrentPage extends Component {
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
      <div>
        <span className="hide-on-small">Showing </span>Proposals{" "}
        {this.props.numberOfProposals - this.props.bookmark + 1 > 0
          ? this.props.numberOfProposals - this.props.bookmark
          : 1}{" "}
        to{" "}
        {this.props.numberOfProposals -
          this.props.bookmark +
          this.props.proposalsPerPage}{" "}
        of {this.props.numberOfProposals}
      </div>
    );
  }
}

export default CurrentPage;
