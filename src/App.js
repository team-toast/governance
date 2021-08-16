import React, {Component} from 'react';
import Web3 from 'web3';
import Web3Connect from 'web3connect';
import contract from './contracts/GovernorAlpha.json';
import Nav from './components/Nav';
import Header from './components/Header';
import Proposals from './components/Proposals';
import Footer from './components/Footer';

import './layout/config/_base.sass';

function initWeb3(provider) {
  const web3 = new Web3(provider)

  web3.eth.extend({
    methods: [
      {
        name: 'chainId',
        call: 'eth_chainId',
        outputFormatter: web3.utils.hexToNumber
      }
    ]
  })
  return web3
}

class App extends Component {
  web3Connect;

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
      txHash: null,
      provider: null,
      connected: null,
      chainId: null,
      networkId: null
    }

    this.web3Connect = new Web3Connect.Core({
      network: "mainnet",
      cacheProvider: true//,
      //providerOptions
    });
  }

  componentDidMount = async () => {
    if (this.web3Connect.cachedProvider) {
      this.onConnect()
    }
  }

  onConnect = async () => {
    const provider = await this.web3Connect.connect();
    await this.subscribeProvider(provider);
    const web3 = initWeb3(provider);

    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    const networkId = await web3.eth.net.getId();
    const chainId = await web3.eth.chainId();

    // Get the contract instance.
    const deployedNetwork = contract.networks[137];
    const instance = new web3.eth.Contract(
      contract.abi,
      deployedNetwork && deployedNetwork.address,
    );

    console.log("CONTRACT ADDRESS: ", deployedNetwork.address);

    await this.setState({
      web3,
      provider,
      connected: true,
      account,
      chainId,
      networkId,
      contract: instance
    });

    this.interval = setInterval(async () => {
      this.getLatestBlock();
      this.getNetworkName();
    }, 2000);

    await this.getAccount();
    this.getLatestBlock();
    await this.getNetworkName();
    this.getTokenBalance();
  }

  subscribeProvider = async (provider) => {
    provider.on('close', () => this.disconnect());

    provider.on('accountsChanged', async (accounts) => {
      await this.setState({ address: accounts[0] });
    });

    provider.on('chainChanged', async (chainId) => {
      const { web3 } = this.state
      const networkId = await web3.eth.net.getId()
      await this.setState({ chainId, networkId });
    });

    provider.on('networkChanged', async (networkId) => {
      const { web3 } = this.state;
      const chainId = await web3.eth.chainId();
      await this.setState({ chainId, networkId });
    });
  }

  disconnect = async () => {
    const { web3 } = this.state
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close()
    }
    await this.web3Connect.clearCachedProvider();
    this.setState({connected: false, account: null});
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
    try {
      const block = await this.state.web3.eth.getBlock('latest');
      this.setState({latestBlock: block.number});
    } catch (error) {
      console.error("Error executing getLatestBlock");
    }
    
  }

  getNetworkName = () => {
    const {networkId} = this.state;

    if(networkId === 1) {
      this.setState({network: 'Mainnet'});
    } else if(networkId === 3) {
      this.setState({network: 'Ropsten'});
    } else if(networkId === 4) {
      this.setState({network: 'Rinkeby'});
    } else if(networkId === 5) {
      this.setState({network: 'Goerli'});
    } else if(networkId === 42) {
      this.setState({network: 'Kovan'});
    } else if(networkId === 137) {
      this.setState({network: 'Matic'});
      console.log("MATIC")
      
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

  getTokenBalance = async () => {
    if(this.state.network === 'Matic') {
      const minABI = [
        {
          constant: true,
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          type: "function",
        },
      ];
      const tokenAddress = contract.contractAddresses['token']['address'];
      const tokenContract = new this.state.web3.eth.Contract(minABI, tokenAddress);
      const retries = 5;
      let tryCount = 0;
      let balanceUpdated = false;
      while(tryCount < retries && balanceUpdated === false) {
        try {
          const balance = await tokenContract.methods.balanceOf(this.state.account).call();
        
          if(balance > 0) {
            this.setState({balance});
          }
          balanceUpdated = true;
        } catch (error) {
          console.error("Error setting token balance: ", error);
          tryCount++;
        }
      }
      
    }
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
        <Nav 
          {...this.state}
          onConnect={this.onConnect}
          disconnect={this.disconnect}
        />
        <Header {...this.state} />
        <Proposals 
          {...this.state} 
          xhr={this.xhr}
          setMessage={this.setMessage} 
          clearMessage={this.clearMessage}
        />
        <Footer {...this.state} />
      </div>
    );
  }
}

export default App;
