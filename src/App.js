import React, {Component} from 'react';
import Web3 from 'web3';
import Web3Connect from 'web3connect';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Portis from '@portis/web3';
import Fortmatic from 'fortmatic';
import Torus from '@toruslabs/torus-embed';
import Authereum from 'authereum';

import contract from './contracts/GovernorAlpha.json';

import Nav from './components/Nav';
import Header from './components/Header';
import Proposals from './components/Proposals';
import Footer from './components/Footer';

//import keys from './keys';

import './layout/config/_base.sass';

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      //infuraId: keys.infura
      infuraId: "80c9b77d70f64a5d94ea177acb67a008"
    }
  },
  // portis: {
  //   package: Portis,
  //   options: {
  //     id: keys.portis
  //   }
  // },
  // fortmatic: {
  //   package: Fortmatic,
  //   options: {
  //     key: keys.fortmatic
  //   }
  // },
  torus: {
    package: Torus,
    options: {
      enableLogging: false,
      buttonPosition: "bottom-left",
      buildEnv: "production",
      showTorusButton: true,
      enabledVerifiers: {
        google: false
      }
    }
  },
  authereum: {
    package: Authereum,
    options: {}
  }
};

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
  //genericExamleFunction(web3);
  return web3
}

async function genericExamleFunction(web3) {
  let proposalObjs = await getAllProposalObjects(web3);

  let eventDetail = await getProposalEventParameters(web3, parseInt(proposalObjs[0]['startBlock']) - 1, proposalObjs[0]['id']);
  console.log(eventDetail);
  // const govAlpha = new web3.eth.Contract(contract.abi, "0xD3b1e8F2bDe0a2DdfC9F6e2EB6e2589e5Ba955b6");
  // let numOfProposals = await govAlpha.methods.proposalCount().call();
  // let proposal1 = await govAlpha.methods.proposals(1).call();

  // let latest_block = await web3.eth.getBlockNumber();
  // console.log("Latest block: ", latest_block);

  // let found = await govAlpha.getPastEvents('allEvents',
  //       { fromBlock: 17868660, toBlock: 17868660 });
  // let rawData = found[0]['raw']['data'];
  // //console.log(found[0]['raw']['data']);
  // let decoded = web3.eth.abi.decodeParameters(['uint256', 'address', 'address[]', 'uint256[]', 'string[]', 'bytes[]', 'uint256', 'uint256', 'string'], rawData);
  
  // console.log("Proposal Object: ");
  // console.log(proposal1);
  // console.log("Decoded Proposal Event: ");
  // console.log(decoded);
  // console.log("------------------");
}

async function getAllProposalObjects(web3) {
  const govAlpha = new web3.eth.Contract(contract.abi, "0xD3b1e8F2bDe0a2DdfC9F6e2EB6e2589e5Ba955b6");
  let numOfProposals = await govAlpha.methods.proposalCount().call();

  let proposals = [];
  let tmpProposal;
  for(let i = 0; i < numOfProposals; i++) {
    tmpProposal = await govAlpha.methods.proposals(i+1).call();
    proposals.push(tmpProposal);
  }
  proposals.forEach(element => {
    console.log("Proposal Object: ");
    console.log(element);
  });
  
  return proposals;
}

async function getProposalEventParameters(web3, blockNumber, Id) {
  const govAlpha = new web3.eth.Contract(contract.abi, "0xD3b1e8F2bDe0a2DdfC9F6e2EB6e2589e5Ba955b6");
  let found = await govAlpha.getPastEvents('allEvents', 
        { 
          filter: {id: Id},
          fromBlock: blockNumber, toBlock: blockNumber });
  let rawData = found[0]['raw']['data'];
  //console.log(found[0]['raw']['data']);
  let decoded = web3.eth.abi.decodeParameters(['uint256', 'address', 'address[]', 'uint256[]', 'string[]', 'bytes[]', 'uint256', 'uint256', 'string'], rawData);

  return decoded
}

// async function buildProposalsArrayForUI(proposals, proposalEvents) {

// }

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
    const deployedNetwork = 137;//contract.networks[networkId];
    const instance = new web3.eth.Contract(
      contract.abi,
      deployedNetwork && deployedNetwork.address,
    );

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
    const block = await this.state.web3.eth.getBlock('latest');
    this.setState({latestBlock: block.number});
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

  getTokenBalance = () => {
    if(this.state.network === 'Mainnet') {
      this.xhr(
        `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xc00e94cb662c3520282e6f5717214004a7f26888&address=${this.state.account}`, 
      (res) => {
        const data = JSON.parse(res);
        const balance = this.state.web3.utils.fromWei(data.result);
        if(balance > 0) {
          this.setState({balance});
        }
      });
    } else if(this.state.network === 'Ropsten') {
      this.xhr(
        `https://api-ropsten.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x1Fe16De955718CFAb7A44605458AB023838C2793&address=${this.state.account}`, 
      (res) => {
        const data = JSON.parse(res);
        const balance = this.state.web3.utils.fromWei(data.result);
        if(balance > 0) {
          this.setState({balance});
        }
      });
    } else {
      // Default to Ropsten for now
      // TODO: Default to mainnet once it's populated with proposals
      this.xhr(
        `https://api-ropsten.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x1Fe16De955718CFAb7A44605458AB023838C2793&address=${this.state.account}`, 
      (res) => {
        const data = JSON.parse(res);
        const balance = this.state.web3.utils.fromWei(data.result);
        if(balance > 0) {
          this.setState({balance});
        }
      });
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
