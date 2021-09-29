import React, { Component } from "react";

import "../layout/components/header.sass";

class CustomHeader extends Component {
  render() {
    return (
      <section className="header">
        <h1 className="header__title">{this.props.title}</h1>
      </section>
    );
  }
}

export default CustomHeader;
