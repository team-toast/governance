import React, {Component} from 'react';

import upvote from '../images/upvote.svg';
import downvote from '../images/downvote.svg';

import '../layout/components/proposals.sass';

class Proposal extends Component {
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
            />
            <img 
              src={downvote} 
              alt="Vote against" 
              className="proposal__arrow" 
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