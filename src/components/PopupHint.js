import React, { Component } from "react";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

class PopupHint extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <OverlayTrigger
        delay={{ hide: 1, show: 1 }}
        rootClose
        overlay={(props) =>
          this.props.message !== "" ? (
            <Tooltip {...props}>{this.props.message}</Tooltip>
          ) : (
            <div></div>
          )
        }
        placement={this.props.position}
      >
        <div
          className={this.props.classToBeUsed}
          style={{
            display: "inline-block",
            disabled: this.props.message === "",
            //cursor: "not-allowed",
            //backgroundColor: "red",
          }}
        >
          {this.props.children}
        </div>
      </OverlayTrigger>
    );
  }
}

export default PopupHint;
