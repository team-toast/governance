import React, {Component} from 'react';

import '../layout/components/footer.sass';

class Footer extends Component {
  render() {
    return (
      <section className="footer">
        <p className="footer__block">
          {this.props.latestBlock ? `Latest Block: ${this.props.latestBlock}` : 'Connect Wallet'} 
        </p>
        <p className="footer__network">
          {this.props.network}
        </p>
      </section>
    );
  }
}

export default Footer;