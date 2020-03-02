import React, {Component} from 'react';

import upvote from '../images/upvote.svg';
import downvote from '../images/downvote.svg';

import '../layout/components/proposals.sass';

class Proposal extends Component {
  handleVoteFor = () => {
    this.props.contract.methods.castVote(this.props.id, true)
      .send({from: this.props.account}, (err, transactionHash) => {
        console.log('Transaction Pending...', transactionHash);
      }).on('confirmation', (number, receipt) => {
        if(number === 0) {
          console.log('Transaction Confirmed!', receipt.transactionHash);
        }
      }).on('error', (err, receipt) => {
        console.log('Transaction Failed.', receipt ? receipt.transactionHash : null);
      });
  }

  handleVoteAgainst = () => {
    this.props.contract.methods.castVote(this.props.id, false)
      .send({from: this.props.account}, (err, transactionHash) => {
        console.log('Transaction Pending...', transactionHash);
      }).on('confirmation', (number, receipt) => {
        if(number === 0) {
          console.log('Transaction Confirmed!', receipt.transactionHash);
        }
      }).on('error', (err, receipt) => {
        console.log('Transaction Failed.', receipt ? receipt.transactionHash : null);
      });
  }

  render() {
    return (
      <div className="proposal">
        <h4 className="proposal__title">
          {this.props.title}
        </h4>
        <div className="proposal__hr"></div>
        <div className="proposal__bottom">
          <div className="proposal__arrows">
            <img 
              src={upvote} 
              alt="Vote for" 
              className="proposal__arrow"
              onClick={this.handleVoteFor}
            />
            <img 
              src={downvote} 
              alt="Vote against" 
              className="proposal__arrow" 
              onClick={this.handleVoteAgainst}
            />
          </div>
          <p className="proposal__description">
            {this.props.description}
          </p>
        </div>
      </div>
    );
  }
}

export default Proposal;