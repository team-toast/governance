import React, {Component} from 'react';
import getWeb3 from "./utils/getWeb3";
import contract from './contracts/GovernorAlpha.json';

import Nav from './components/Nav';
import Header from './components/Header';
import Proposals from './components/Proposals';

import './layout/config/_base.sass';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      web3: null, 
      contract: null, 
      accounts: null,
      account: null
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

    this.accountInterval = setInterval(async () => {
      const accounts = await this.state.web3.eth.getAccounts();
      if (accounts[0] !== this.state.account) {
        this.setState({
          account: accounts[0]
        });
        console.log(this.state.account);
      }
    }, 1000);
  }

  render() {
    return (
      <div className="app">
        <Nav />
        <Header 
          {...this.state}
        />
        <Proposals {...this.state} />
      </div>
    );
  }
}

export default App;
