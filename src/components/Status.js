import React, { Component } from "react";

import "../layout/components/status.sass";

class Status extends Component {
  render() {
    return (
      <div className="status-loader">
        <div className="vertical-align">{this.props.firetext}</div>
        <span className="close-btn" onClick={this.props.hidestatus}>
          x
        </span>
      </div>
    );
  }
}

export default Status;
