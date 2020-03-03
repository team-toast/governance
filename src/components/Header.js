import React, {Component} from 'react';

import '../layout/components/header.sass';

class Header extends Component {
  render() {
    return(
      <section className="header">
        <h1 className="header__title">
          Compound Governance Proposals
        </h1>
        <p className="header__balance">
          {/* TODO: Render balance */}
          {/* COMP Balance: 297 */}
        </p>
      </section>
    );
  }
}

export default Header;