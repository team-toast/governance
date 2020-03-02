import React, {Component} from 'react';

import '../layout/components/header.sass';

class Header extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      openCheck: true,
      closedCheck: false
    }
  }

  render() {
    return(
      <section className="header">
        <h1 className="header__title">
          {/* TODO: Conditionally render 'active' or 'ended' */}
          Active Governance Proposals
        </h1>
        <div className="header__utils">
          <label className="header__label header__label--open">
            <input
              type="checkbox"
              className="header__checkbox header__checkbox--open"
              checked={this.state.openCheck} 
              // TODO: Add check handler
            />
            <span 
              className="header__checkmark header__checkmark--open">
            </span>
            <span className="header__label-title--open">Open Proposals</span>
          </label>
          <p className="header__balance">
            {/* TODO: Render balance */}
            COMP Balance: 297
          </p>
          <label className="header__label header__label--closed">
            <span className="header__label-title--closed">Closed Proposals</span>
            <input
              type="checkbox"
              className="header__checkbox header__checkbox--closed"
              checked={this.state.closedCheck} 
              // TODO: Add check handler
            />
            <span 
              className="header__checkmark header__checkmark--closed">
            </span>
          </label>
        </div>
      </section>
    );
  }
}

export default Header;