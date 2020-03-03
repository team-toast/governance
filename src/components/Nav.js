import React, {Component} from 'react';

import Message from './Message';

import '../layout/components/nav.sass';

import logo from '../images/compound.png';

class Nav extends Component {
  render() {
    let button;

    if(this.props.message) {
      button = <Message {...this.props} />
    } else {
      button = 
        <p className="nav__account">
          {this.props.account ? `${this.props.account.slice(0, 4)}...${this.props.account.slice(this.props.account.length - 4, this.props.account.length)}` : 'Connect Metamask'}
        </p>
    }

    return(
      <nav className="nav">
        <a className="nav__brand" href="/">
          <img src={logo} alt="Compound" className="nav__brand-logo" />
          <h1 className="nav__brand-name">
            Compound Governance
          </h1>
        </a>
        {button}
      </nav>
    );
  }
}

export default Nav;