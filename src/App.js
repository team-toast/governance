import React, { Component } from "react";
import { Tabs, Tab, Container } from "react-bootstrap";

import Web3 from "web3";
import Web3Connect from "web3connect";
import contract from "./contracts/GovernorAlpha.json";
import compTokenContract from "./contracts/Comp.json";
import Dai from "./contracts/Dai.json";
import Nav from "./components/Nav";
import Header from "./components/Header";
import Proposals from "./components/Proposals";
import Footer from "./components/Footer";
import CreateProposalForm from "./components/CreateProposalForm";
import WalletConnectProvider from "@walletconnect/web3-provider";
import CreateCustomProposalForm from "./components/CreateCustomProposalForm";
import "./layout/config/_base.sass";

import Status from "./components/Status";

function initWeb3(provider) {
  const web3 = new Web3(provider);

  web3.eth.extend({
    methods: [
      {
        name: "chainId",
        call: "eth_chainId",
        outputFormatter: web3.utils.hexToNumber,
      },
    ],
  });
  return web3;
}

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    rpc: {
      137: "https://rpc-mainnet.matic.quiknode.pro",
    },
  },
};

class App extends Component {
  web3Connect;

  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      contract: null,
      accounts: null,
      account: null,
      latestBlock: "",
      network: null,
      balance: "Unknown",
      votingPower: "Unknown",
      totalSupply: 0,
      message: null,
      txHash: null,
      provider: null,
      connected: null,
      chainId: null,
      networkId: null,
      delegateeAddress: "",
      delegatedAddress: "Unknown",
      treasuryBalance: "Unknown",
      disableButtons: true,
      metaMaskMissing: false,
      disableMessage: "Your wallet is not connected",
      firetext: "Delegating ...",
      firetextShow: false,
    };

    this.web3Connect = new Web3Connect.Core({
      network: "mainnet",
      cacheProvider: true,
      providerOptions,
    });
  }

  componentDidMount = async () => {
    if (this.web3Connect.cachedProvider) {
      this.onConnect();
    }
  };

  onConnect = async () => {
    console.log("OnConnect click");
    if (typeof window.ethereum === "undefined") {
      console.log("WEB3 not available");
      this.setState({ metaMaskMissing: true });
      return;
    } else {
      const provider = window.ethereum;
      console.log(provider.isMetaMask);
      if (provider.isMetaMask) {
        this.setState({ metaMaskMissing: false });
      } else {
        this.setState({ metaMaskMissing: true });
        return;
      }
    }

    const provider = await this.web3Connect.connect();

    await this.subscribeProvider(provider);
    const web3 = initWeb3(provider);

    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    const networkId = await web3.eth.net.getId();
    const chainId = await web3.eth.chainId();

    console.log("PROVIDER: ", web3.eth.currentProvider);

    // Get the contract instance.
    const deployedNetwork = contract.networks[137];
    const instance = new web3.eth.Contract(
      contract.abi,
      deployedNetwork && deployedNetwork.address
    );

    console.log("CONTRACT ADDRESS: ", deployedNetwork.address);

    await this.setState({
      web3,
      provider,
      connected: true,
      account,
      chainId,
      networkId,
      contract: instance,
    });

    this.determineButtonsDisabled(web3);
  };

  determineButtonsDisabled = async (web3) => {
    const tmpAccount = await this.getAccount();
    const netId = await web3.eth.net.getId();
    const netName = this.getNetworkName(netId);

    console.log("tmpAccount", tmpAccount);
    if (tmpAccount === "undefined") {
      this.setState({ disableButtons: true });
      this.setState({ disableMessage: "Your wallet is not connected" });
      return;
    } else {
      this.setState({ disableMessage: "" });
    }

    if (netName === "Matic") {
      this.getLatestBlock();
      this.getTotalSupply();
      this.getTokenBalance();
      this.getDelegateToAddress();
      this.getTreasuryBalance();
      if ((await this.getVotingPower()) === "0") {
        this.setState({ disableButtons: true });
        this.setState({ disableMessage: "You don't have voting power" });
      } else {
        this.setState({ disableButtons: false });
        this.setState({ disableMessage: "" });
      }
    } else {
      this.setState({ disableButtons: true });
      this.setState({ disableMessage: "You are not on the Matic network" });
    }
  };

  subscribeProvider = async (provider) => {
    provider.on("disconnect", () => {
      this.setState({ disableMessage: "Your wallet is not connected." });
      console.log("DISCONNECTIONNGNGNGN");
      this.disconnect();
    });

    provider.on("accountsChanged", async (accounts) => {
      const accounts2 = await this.state.web3.eth.getAccounts();
      this.setState({ account: accounts2[0] });
      await this.getVotingPower(accounts2[0]);
      await this.getTotalSupply(accounts2[0]);
      await this.getTokenBalance(accounts2[0]);
      await this.getDelegateToAddress(accounts2[0]);
    });

    provider.on("chainChanged", async (chainId) => {
      const { web3 } = this.state;
      const networkId = await web3.eth.net.getId();
      if (this.state.connected) {
        if (networkId === 137) {
          this.setState({ chainId, networkId });
          this.getNetworkName(networkId);
          this.determineButtonsDisabled(this.state.web3);
        } else {
          this.determineButtonsDisabled(this.state.web3);
        }
      }
    });

    // provider.on("networkChanged", async (networkId) => {
    //   const { web3 } = this.state;
    //   const chainId = await web3.eth.chainId();
    //   await this.setState({ chainId, networkId });
    //   this.getNetworkName();
    //   this.getVotingPower();
    //   this.getTotalSupply();
    //   this.getTokenBalance();
    //   this.getDelegateToAddress();
    // });
  };

  disconnect = async () => {
    const { web3 } = this.state;
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close();
    }
    await this.web3Connect.clearCachedProvider();
    this.setState({ connected: false, account: null });
    this.setState({ disableMessage: "Your wallet is not connected." });
    this.setState({ disableButtons: true });
  };

  getAccount = async () => {
    const accounts = await this.state.web3.eth.getAccounts();
    if (accounts[0] !== this.state.account) {
      this.setState({
        account: accounts[0],
      });
      console.log(this.state.account);
      return accounts[0];
    }
  };

  getGasPrice = async () => {
    //this.sleep(1000);
    let gasPrice = 0;
    try {
      await this.state.web3.eth.getGasPrice().then((result) => {
        gasPrice = parseInt(parseFloat(result) * 1.5);
        console.log("GAS PRICE: ", gasPrice.toString());
      });
      return gasPrice.toString();
    } catch (error) {
      console.error("Error getting gas price: ", error);
      return "27000000000";
    }
  };

  getLatestBlock = async () => {
    try {
      const block = await this.state.web3.eth.getBlock("latest");
      this.setState({ latestBlock: block.number });
    } catch (error) {
      console.error("Error executing getLatestBlock");
    }
  };

  getNetworkName = (netID = null) => {
    let { networkId } = this.state;

    if (netID !== null) {
      networkId = netID;
    }

    if (networkId === 1) {
      this.setState({ network: "Mainnet" });
    } else if (networkId === 3) {
      this.setState({ network: "Ropsten" });
    } else if (networkId === 4) {
      this.setState({ network: "Rinkeby" });
    } else if (networkId === 5) {
      this.setState({ network: "Goerli" });
    } else if (networkId === 42) {
      this.setState({ network: "Kovan" });
    } else if (networkId === 137) {
      this.setState({ network: "Matic" });
      return "Matic";
    } else {
      this.setState({ network: "Unknown Network" });
    }
  };

  xhr = (api, callback) => {
    const xhr = new XMLHttpRequest();

    xhr.open("GET", `${api}`, true);
    xhr.send();

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        callback(xhr.responseText);
      }
    };
  };

  getTokenBalance = async (account = "none") => {
    if (this.state.network === "Matic") {
      const tokenAddress = contract.contractAddresses["token"]["address"];

      const tokenContract = new this.state.web3.eth.Contract(
        compTokenContract,
        tokenAddress
      );

      let overrideAccount = "";
      if (account !== "none") {
        overrideAccount = account;
      } else {
        overrideAccount = this.state.account;
      }

      let balanceUpdated = false;
      while (balanceUpdated === false) {
        try {
          let balance = await tokenContract.methods
            .balanceOf(overrideAccount)
            .call();

          balance = this.state.web3.utils.fromWei(balance);
          console.log("BALANCE: ", balance);
          balance = this.numberWithCommas(parseFloat(balance).toFixed(2));
          //if (balance > 0) {
          this.setState({ balance });
          //}
          balanceUpdated = true;
        } catch (error) {
          console.error("Error setting token balance: ", error);
          this.sleep(1000);
        }
      }
    }
  };

  getTreasuryBalance = async () => {
    if (this.state.network === "Matic") {
      const daiAddress = contract.contractAddresses["dai"]["address"];

      const daiContract = new this.state.web3.eth.Contract(Dai, daiAddress);

      let overrideAccount = contract.contractAddresses["forwarder"]["address"];

      let balanceUpdated = false;
      while (balanceUpdated === false) {
        try {
          let balance = await daiContract.methods
            .balanceOf(overrideAccount)
            .call();

          balance = this.state.web3.utils.fromWei(balance);
          console.log("Treasury BALANCE: ", balance);
          balance = this.numberWithCommas(parseFloat(balance).toFixed(2));
          balanceUpdated = true;
          this.setState({ treasuryBalance: balance });
        } catch (error) {
          console.error("Error getting treasury balance: ", error);
          this.sleep(1000);
        }
      }
    }
  };

  sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  getVotingPower = async (account = "none") => {
    if (this.state.network === "Matic") {
      const tokenAddress = contract.contractAddresses["token"]["address"];

      const tokenContract = new this.state.web3.eth.Contract(
        compTokenContract,
        tokenAddress
      );

      let overrideAccount = "";
      if (account !== "none") {
        overrideAccount = account;
      } else {
        overrideAccount = this.state.account;
      }

      let votingPowerUpdated = false;
      while (votingPowerUpdated === false) {
        try {
          const votingPower = await tokenContract.methods
            .getCurrentVotes(overrideAccount)
            .call();

          this.setState({ votingPower });

          votingPowerUpdated = true;
          return votingPower;
        } catch (error) {
          console.error("Error setting token voting power: ", error);
          await this.sleep(1000);
        }
      }
    }
  };

  getTotalSupply = async (account = "none") => {
    if (this.state.network === "Matic") {
      const tokenAddress = contract.contractAddresses["token"]["address"];

      const tokenContract = new this.state.web3.eth.Contract(
        compTokenContract,
        tokenAddress
      );

      let totalSupplyUpdated = false;
      while (totalSupplyUpdated === false) {
        try {
          const totalSupply = await tokenContract.methods.totalSupply().call();

          if (totalSupply > 0) {
            this.setState({ totalSupply });
          }
          totalSupplyUpdated = true;
        } catch (error) {
          console.error("Error setting token total supply: ", error);
          await this.sleep(1000);
        }
      }
    }
  };

  getDelegateToAddress = async (account = "none") => {
    if (this.state.network === "Matic") {
      const tokenAddress = contract.contractAddresses["token"]["address"];

      const tokenContract = new this.state.web3.eth.Contract(
        compTokenContract,
        tokenAddress
      );

      let overrideAccount = "";
      if (account !== "none") {
        overrideAccount = account;
      } else {
        overrideAccount = this.state.account;
      }

      let delegatedAddressUpdated = false;
      while (delegatedAddressUpdated === false) {
        try {
          const delegatedAddress = await tokenContract.methods
            .delegates(overrideAccount)
            .call();

          if (delegatedAddress === this.state.account) {
            this.setState({ delegatedAddress: "Self" });
          } else if (
            delegatedAddress === "0x0000000000000000000000000000000000000000"
          ) {
            this.setState({ delegatedAddress: "Not yet delegated" });
          } else {
            this.setState({ delegatedAddress });
          }

          delegatedAddressUpdated = true;
        } catch (error) {
          await this.sleep(1000);
          console.error("Error setting token voting power: ", error);
        }
      }
    }
  };

  numberWithCommas = (x) => {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
  };

  setMessage = (newMessage, txHash) => {
    this.setState({
      message: newMessage,
      txHash,
    });
    console.log(this.state.message);
    console.log(this.state.txHash);
  };

  clearMessage = () => {
    this.setState({
      message: null,
      txHash: null,
    });
  };

  setStatusOf = (text, show) => {
    this.setState({
      firetext: text,
      firetextShow: show,
    });
  };

  delegate = async () => {
    this.setState({
      firetext: "Delegating ...",
      firetextShow: true,
    });

    const tokenAddress = contract.contractAddresses["token"]["address"];

    const tokenContract = new this.state.web3.eth.Contract(
      compTokenContract,
      tokenAddress
    );
    try {
      const gasPrice = await this.getGasPrice();
      tokenContract.methods
        .delegate(this.state.delegateeAddress)
        .send(
          { from: this.state.account, gasPrice: gasPrice },
          (err, transactionHash) => {
            this.setState({
              firetext: "Transaction Pending ...",
              firetextShow: true,
            });
            this.setMessage("Transaction Pending...", transactionHash);
            console.log("Transaction Pending...", transactionHash);
          }
        )
        .on("confirmation", (number, receipt) => {
          if (number === 0) {
            this.setMessage("Transaction Confirmed!", receipt.transactionHash);
            console.log("Transaction Confirmed!", receipt.transactionHash);
            this.getVotingPower(); // Update voting power that might have changed after delegating
            this.getDelegateToAddress();
            this.setState({
              firetext: "Transaction Confirmed!",
              firetextShow: true,
            });
          }
          setTimeout(() => {
            this.clearMessage();
          }, 5000);
        })
        .on("error", (err, receipt) => {
          this.setMessage(
            "Transaction Failed.",
            receipt ? receipt.transactionHash : null
          );
          this.setState({
            firetext: "Could not delegate. Please try again.",
            firetextShow: true,
          });
          console.log("Transaction Failed!");
        });

      console.log("Delegated to: ", this.state.delegateeAddress);
    } catch (error) {
      this.setState({
        firetext: "Could not delegate.",
        firetextShow: true,
      });
      console.error("Error in delegate method: ", error);
    }
  };

  hideLoader = () => {
    this.setState({
      firetext: "",
      firetextShow: false,
    });
  };

  updateDelegateeAddress = async (evt) => {
    this.setState({
      delegateeAddress: evt.target.value,
    });
    console.log(this.state.delegateeAddress);
  };

  render() {
    return (
      <div className="app">
        {this.state.firetextShow && (
          <Status
            hidestatus={this.hideLoader}
            firetext={this.state.firetext}
          ></Status>
        )}
        <Nav
          {...this.state}
          onConnect={this.onConnect}
          disconnect={this.disconnect}
        />
        <Header
          {...this.state}
          delegate={this.delegate}
          updateDelegateeAddress={this.updateDelegateeAddress}
          disableButtons={this.state.disableButtons}
          disableMessage={this.state.disableMessage}
        />
        <Container className="tabcontainer">
          <Tabs
            fill
            defaultActiveKey="proposals"
            id="uncontrolled-tab"
            className="tabs"
          >
            <Tab eventKey="proposals" title="View Proposals" color="white">
              <div>
                <Proposals
                  {...this.state}
                  xhr={this.xhr}
                  setMessage={this.setMessage}
                  clearMessage={this.clearMessage}
                  getLatestBlock={this.getLatestBlock}
                  getNetworkName={this.getNetworkName}
                  numberWithCommas={this.numberWithCommas}
                  buttonsDisabled={this.state.disableButtons}
                  getGasPrice={this.getGasPrice}
                  setStatusOf={this.setStatusOf}
                />
              </div>
            </Tab>
            <Tab
              eventKey="create_payment_proposal"
              title="Create Dai Payment Proposal"
            >
              <CreateProposalForm
                setStatusOf={this.setStatusOf}
                setMessage={this.setMessage}
                clearMessage={this.clearMessage}
                getTreasuryBalance={this.getTreasuryBalance}
                getGasPrice={this.getGasPrice}
                disableButtons={this.disableButtons}
                {...this.state}
              ></CreateProposalForm>
            </Tab>
            <Tab
              eventKey="create_custom_proposal"
              title="Create Custom Proposal"
            >
              <CreateCustomProposalForm
                setStatusOf={this.setStatusOf}
                setMessage={this.setMessage}
                clearMessage={this.clearMessage}
                getGasPrice={this.getGasPrice}
                disableButtons={this.disableButtons}
                {...this.state}
              ></CreateCustomProposalForm>
            </Tab>
          </Tabs>
        </Container>
        <Footer {...this.state} />
      </div>
    );
  }
}

export default App;
