import React, {Component} from 'react';

class Proposal extends Component {
  render() {
    return (
      <div className="proposal">
        <h4 className="proposal__title">
          {this.props.title}
        </h4>
        <p className="proposal__description">
          {this.props.description}
        </p>
      </div>
    );
  }
}

export default Proposal;