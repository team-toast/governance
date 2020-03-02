import React, {Component} from 'react';

import '../layout/components/proposals.sass';

class Proposal extends Component {
  render() {
    return (
      <div className="proposal">
        <h4 className="proposal__title">
          {this.props.title}
        </h4>
        <div className="proposal__hr"></div>
        <p className="proposal__description">
          {this.props.description}
        </p>
      </div>
    );
  }
}

export default Proposal;