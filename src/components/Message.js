import React, {Component} from 'react';

import '../layout/components/message.sass';

class Message extends Component {
  render() {
    let network;

    if(this.props.network === 'Ropsten') {
      network = 'ropsten.';
    }

    if(this.props.message) {
      return(
        <a 
          className="message"
          target="_blank"
          rel="noopener noreferrer"
          href={this.props.txHash ? `http://${network}etherscan.io/tx/${this.props.txHash}` : null}
        >
          {this.props.message}
        </a>
      );
    } else {
      return null;
    }
  }
}

export default Message;