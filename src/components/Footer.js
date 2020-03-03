import React, {Component} from 'react';

import '../layout/components/footer.sass';

class Footer extends Component {
  render() {
    return (
      <section className="footer">
        <p className="footer__block">
          {`Latest Block: ${this.props.latestBlock}`} 
        </p>
        <p className="footer__network">
          {this.props.network}
        </p>
      </section>
    );
  }
}

export default Footer;