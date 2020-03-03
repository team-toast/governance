import React, {Component} from 'react';

import upvote from '../images/upvote.svg';
import downvote from '../images/downvote.svg';

import '../layout/components/proposals.sass';

class Proposal extends Component {
  handleVoteFor = () => {
    this.props.contract.methods.castVote(this.props.id, true)
      .send({from: this.props.account}, (err, transactionHash) => {
        this.props.setMessage('Transaction Pending...', transactionHash);
      }).on('confirmation', (number, receipt) => {
        if(number === 0) {
          this.props.setMessage('Transaction Confirmed!', receipt.transactionHash);
        }
        setTimeout(() => {
          this.props.clearMessage();
        }, 5000);
      }).on('error', (err, receipt) => {
        this.props.setMessage('Transaction Failed.', receipt ? receipt.transactionHash : null);
      });
  }

  handleVoteAgainst = () => {
    this.props.contract.methods.castVote(this.props.id, false)
      .send({from: this.props.account}, (err, transactionHash) => {
        this.props.setMessage('Transaction Pending...', transactionHash);
      }).on('confirmation', (number, receipt) => {
        if(number === 0) {
          this.props.setMessage('Transaction Confirmed!', receipt.transactionHash);
        }
        setTimeout(() => {
          this.props.clearMessage();
        }, 5000);
      }).on('error', (err, receipt) => {
        this.props.setMessage('Transaction Failed.', receipt ? receipt.transactionHash : null);
      });
  }

  render() {
    let arrows;

    if(this.props.end > this.props.latestBlock) {
      arrows = 
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
        </div>;
    }
    
    return (
      <div className="proposal">
        <h4 className="proposal__title">
          {this.props.title}
        </h4>
        <div className="proposal__bottom">
          {arrows}
          <p className="proposal__description">
            {this.props.description}
          </p>
        </div>
      </div>
    );
  }
}

export default Proposal;