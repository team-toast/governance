import React, {Component} from 'react';

class Proposals extends Component {
  componentDidMount = () => {
    this.getProposals()
  }
  
  xhr = (api, callback) => {
    const xhr = new XMLHttpRequest();

    xhr.open('GET', `${api}`, true);
    xhr.send();

    xhr.onreadystatechange = (e) => {
      if(xhr.readyState === 4 && xhr.status === 200) {
        callback(xhr.responseText);
      }
    }
  }

  getProposals = async () => {
    if(this.props.openCheck === true) {
      // TODO: Query mainnet api
      this.xhr("https://api.compound.finance/api/v2/governance/proposals?network=ropsten", (res) => {
        const data = JSON.parse(res);
        console.log(data.proposals);
      });
    }
  }

  render() {
    return (
      <h1>Proposals</h1>
    );
  }
}

export default Proposals;