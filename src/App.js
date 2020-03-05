import React, {Component} from 'react';
import getWeb3 from "./utils/getWeb3";
import contract from './contracts/GovernorAlpha.json';

import Nav from './components/Nav';
import Header from './components/Header';
import Proposals from './components/Proposals';
import Footer from './components/Footer';

import './layout/config/_base.sass';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      web3: null, 
      contract: null, 
      accounts: null,
      account: null,
      latestBlock: '',
      network: null,
      balance: 0,
      message: null,
      txHash: null
    }
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = contract.networks[networkId];
      const instance = new web3.eth.Contract(
        contract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance });
    } catch (error) {
      // Catch any errors for any of the above operations.
      console.error(error);
    }

    this.interval = setInterval(async () => {
      this.getLatestBlock();
      this.getAccount();
    }, 1000);

    await this.getAccount();
    this.getLatestBlock();
    this.getNetwork();
    this.getTokenBalance();
  }

  getAccount = async () => {
    const accounts = await this.state.web3.eth.getAccounts();
    if (accounts[0] !== this.state.account) {
      this.setState({
        account: accounts[0]
      });
      console.log(this.state.account);
    }
  }

  getLatestBlock = async () => {
    const block = await this.state.web3.eth.getBlock('latest');
    this.setState({latestBlock: block.number});
  }

  getNetwork = async () => {
    const id = await this.state.web3.eth.net.getId();
    this.getNetworkName(id);
  }

  getNetworkName = (id) => {
    if(id === 1) {
      this.setState({network: 'Mainnet'});
    } else if(id === 3) {
      this.setState({network: 'Ropsten'});
    } else if(id === 4) {
      this.setState({network: 'Rinkeby'});
    } else if(id === 5) {
      this.setState({network: 'Goerli'});
    } else if(id === 42) {
      this.setState({network: 'Kovan'});
    } else {
      this.setState({network: 'Unknown Network'});
    }
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

  getTokenBalance = () => {
    this.xhr(
      `https://api-ropsten.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x1Fe16De955718CFAb7A44605458AB023838C2793&address=${this.state.account}`, 
    (res) => {
      const data = JSON.parse(res);
      const balance = this.state.web3.utils.fromWei(data.result);
      this.setState({balance});
    });
  }

  setMessage = (newMessage, txHash) => {
    this.setState({
      message: newMessage,
      txHash
    });
    console.log(this.state.message);
    console.log(this.state.txHash);
  }

  clearMessage = () => {
    this.setState({
      message: null,
      txHash: null
    });
  }

  render() {
    return (
      <div className="app">
        <Nav {...this.state} />
        <Header {...this.state} />
        {this.state.network &&
          <Proposals 
            {...this.state} 
            xhr={this.xhr}
            setMessage={this.setMessage} 
            clearMessage={this.clearMessage}
          />
        }
        <Footer {...this.state} />
      </div>
    );
  }
}

export default App;
