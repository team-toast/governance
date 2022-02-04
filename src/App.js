import React, { Component } from "react";

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
import CustomHeader from "./components/CustomHeader";
import ProgressBar from "./components/ProgressBar";

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
            421611: "https://rinkeby.arbitrum.io/rpc",
        },
    },
};

class App extends Component {
    web3Connect;

    constructor(props) {
        super(props);

        this.state = {
            web3: null,
            web3Mainnet: null,
            contract: null,
            accounts: null,
            account: null,
            latestBlock: "",
            network: null,
            balance: "Unknown",
            fryBalance: "Unknown",
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
            firetext: "",
            firetextShow: false,
            page: "page__proposals",
            processStage: [],
            convertedAddress: "",
        };

        this.web3Connect = new Web3Connect.Core({
            network: "mainnet",
            cacheProvider: true,
            providerOptions,
        });
    }

    fryGfryMod = (fryMod, gFryMod) => {
        let tmpFry = this.state.fryBalance.replace(/,/g, "");
        let tmpGfry = this.state.balance.replace(/,/g, "");
        let tmpVP = this.state.votingPower.replace(/,/g, "");
        let tmpTS = this.state.totalSupply;

        this.setState({
            fryBalance: this.numberWithCommas(
                (parseFloat(tmpFry) + parseFloat(fryMod)).toString()
            ),
            balance: this.numberWithCommas(
                (parseFloat(tmpGfry) + parseFloat(gFryMod)).toString()
            ),
        });

        if (this.state.delegatedAddress.toLowerCase() === "self") {
            this.setState({
                votingPower: this.state.web3.utils.toWei(
                    (
                        parseFloat(this.state.web3.utils.fromWei(tmpVP)) +
                        parseFloat(gFryMod)
                    ).toString()
                ),
                totalSupply: this.state.web3.utils.toWei(
                    (
                        parseFloat(this.state.web3.utils.fromWei(tmpTS)) +
                        parseFloat(gFryMod)
                    ).toString()
                ),
            });
            console.log(
                "VOTING POWER: ",
                parseFloat(this.state.web3.utils.fromWei(tmpVP)) +
                    parseFloat(gFryMod)
            );
            console.log(
                "Have voting power? ",
                parseFloat(this.state.web3.utils.fromWei(tmpVP)) +
                    parseFloat(gFryMod) >
                    0.0
            );
            if (
                parseFloat(this.state.web3.utils.fromWei(tmpVP)) +
                    parseFloat(gFryMod) ===
                0
            ) {
                console.log("Account does not have voting power");
                this.setState({
                    disableButtons: true,
                });
                this.setState({
                    disableMessage: "You don't have voting power",
                });
            } else {
                console.log("Account has voting power");
                this.setState({
                    disableButtons: false,
                });
                this.setState({ disableMessage: "" });
            }
        }
    };

    componentDidMount = async () => {
        this.mainnetConnect();
        if (
            this.web3Connect.cachedProvider &&
            typeof window.ethereum !== "undefined"
        ) {
            this.onConnect();
        } else {
            // Todo default connect
            this.defaultConnect();
        }
    };

    defaultConnect = async () => {
        console.log("Default Connect");
        const web3 = new Web3(
            new Web3.providers.HttpProvider("https://rinkeby.arbitrum.io/rpc")
        );

        //console.log("Net ID test: ", netId);
        await this.setState({
            web3,
            network: "Arbitrum",
        });
        this.getLatestBlock();
    };

    mainnetConnect = async () => {
        console.log("Mainnet Connect");
        const web3Mainnet = new Web3(
            new Web3.providers.HttpProvider(
                "https://rinkeby-light.eth.linkpool.io/"
            )
        );
        await this.setState({
            web3Mainnet,
        });
    };

    onConnect = async () => {
        console.log("OnConnect click");
        if (typeof window.ethereum === "undefined") {
            console.log("WEB3 not available");
            this.setState({ metaMaskMissing: true });
            return;
        } else {
            const provider = window.ethereum;
            //console.log(provider.isMetaMask);
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

        //console.log("PROVIDER: ", web3.eth.currentProvider);

        // Get the contract instance.
        const deployedNetwork = contract.networks[421611];
        const instance = new web3.eth.Contract(
            contract.abi,
            deployedNetwork && deployedNetwork.address
        );

        //console.log("CONTRACT ADDRESS: ", deployedNetwork.address);

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

        //console.log("tmpAccount", tmpAccount);
        if (tmpAccount === "undefined") {
            this.setState({ disableButtons: true });
            this.setState({ disableMessage: "Your wallet is not connected" });
            return;
        } else {
            this.setState({ disableMessage: "" });
        }

        if (netName === "Arbitrum") {
            this.getLatestBlock();
            this.getTotalSupply();
            this.setState({
                balance: await this.getTokenBalance(
                    contract.contractAddresses["token"]["address"]
                ),
            });
            this.setState({
                fryBalance: await this.getTokenBalance(
                    contract.contractAddresses["fry"]["address"]
                ),
            });
            this.getDelegateToAddress();
            this.getTreasuryBalance();
            if ((await this.getVotingPower()) === "0") {
                this.setState({ disableButtons: true });
                this.setState({
                    disableMessage: "You don't have voting power",
                });
            } else {
                this.setState({ disableButtons: false });
                this.setState({ disableMessage: "" });
            }
        } else {
            this.setState({ disableButtons: true });
            this.setState({
                disableMessage: "You are not on the Arbitrum network",
            });
        }
    };

    subscribeProvider = async (provider) => {
        provider.on("disconnect", () => {
            this.setState({ disableMessage: "Your wallet is not connected." });
            console.log("Disconnecting");
            this.disconnect();
        });

        provider.on("accountsChanged", async (accounts) => {
            const accounts2 = await this.state.web3.eth.getAccounts();
            this.setState({ account: accounts2[0] });
            await this.getVotingPower(accounts2[0]);
            await this.getTotalSupply(accounts2[0]);
            this.determineButtonsDisabled(this.state.web3);
            this.setState({
                balance: await this.getTokenBalance(
                    contract.contractAddresses["token"]["address"]
                ),
            });
            this.setState({
                fryBalance: await this.getTokenBalance(
                    contract.contractAddresses["fry"]["address"]
                ),
            });
            await this.getDelegateToAddress(accounts2[0]);
        });

        provider.on("chainChanged", async (chainId) => {
            const { web3 } = this.state;
            const networkId = await web3.eth.net.getId();
            if (this.state.connected) {
                if (networkId === 421611) {
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
        this.setState({
            page: "page__proposals",
        });
        const { web3 } = this.state;
        if (web3 && web3.currentProvider && web3.currentProvider.close) {
            await web3.currentProvider.close();
        }
        await this.web3Connect.clearCachedProvider();
        this.setState({ connected: false, account: null });
        this.setState({ disableMessage: "Your wallet is not connected." });
        this.setState({ disableButtons: true });
        this.setState({ delegatedAddress: "Unknown" });
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
        let gotLatestBlock = false;
        while (gotLatestBlock === false) {
            try {
                const block = await this.state.web3.eth.getBlock("latest");
                //console.log("Block Response: ", block);
                //console.log("Block Number: ", Number(block.l1BlockNumber));
                this.setState({ latestBlock: Number(block.l1BlockNumber) });
                gotLatestBlock = true;
                return block;
            } catch (error) {
                console.error("Error executing getLatestBlock");
                this.sleep(500);
            }
        }
    };

    getBlockTimeStamp = async (blockNumber) => {
        try {
            while (this.state.web3Mainnet === null) {
                this.sleep(500);
                console.log("sleeping");
            }
            //console.log("Latest Block: ", this.state.latestBlock);
            //console.log("Block to find: ", blockNumber);
            //console.log("web3Mainnet: ", this.state.web3Mainnet);
            if (blockNumber < this.state.latestBlock) {
                const blockInfo = await this.state.web3Mainnet.eth.getBlock(
                    blockNumber
                );
                //console.log("Block Info: ", blockInfo);
                return blockInfo["timestamp"];
            } else {
                return 0;
            }
        } catch (error) {
            console.error("Error executing getBlockTimeStamp", error);

            return 0;
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
        } else if (networkId === 421611) {
            this.setState({ network: "Arbitrum" });
            return "Arbitrum";
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

    getTokenBalance = async (tokenAddress, account = "none") => {
        if (this.state.network === "Arbitrum") {
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
                    balance = this.numberWithCommas(
                        parseFloat(balance).toFixed(2)
                    );

                    return balance;
                } catch (error) {
                    this.sleep(1000);
                    console.error("Error Setting token balance: ", error);
                }
            }
        }
    };

    getTreasuryBalance = async () => {
        if (this.state.network === "Arbitrum") {
            const daiAddress = contract.contractAddresses["dai"]["address"];

            const daiContract = new this.state.web3.eth.Contract(
                Dai,
                daiAddress
            );

            let overrideAccount =
                contract.contractAddresses["forwarder"][
                    "address"
                ].toLowerCase();

            let balanceUpdated = false;
            while (balanceUpdated === false) {
                try {
                    let balance = await daiContract.methods
                        .balanceOf(overrideAccount)
                        .call();

                    balance = this.state.web3.utils.fromWei(balance);
                    console.log("Treasury BALANCE: ", balance);
                    balance = this.numberWithCommas(
                        parseFloat(balance).toFixed(2)
                    );
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
        if (this.state.network === "Arbitrum") {
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
        if (this.state.network === "Arbitrum") {
            const tokenAddress = contract.contractAddresses["token"]["address"];

            const tokenContract = new this.state.web3.eth.Contract(
                compTokenContract,
                tokenAddress
            );

            let totalSupplyUpdated = false;
            while (totalSupplyUpdated === false) {
                try {
                    const totalSupply = await tokenContract.methods
                        .totalSupply()
                        .call();

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
        if (this.state.network === "Arbitrum") {
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

                    console.log("DELEGATED ADDRESS: ", delegatedAddress);

                    if (delegatedAddress === this.state.account) {
                        this.setState({ delegatedAddress: "Self" });
                    } else if (
                        delegatedAddress ===
                        "0x0000000000000000000000000000000000000000"
                    ) {
                        this.setState({
                            delegatedAddress: "Not yet delegated",
                        });
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
        return parseFloat(x).toLocaleString("en-US", {
            maximumFractionDigits: 2,
        });
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

    setProgress = (data) => {
        this.setState({
            processStage: data,
        });
    };

    delegate = async () => {
        this.setState({
            firetext: "Delegating",
            firetextShow: true,
        });
        this.setProgress([]);

        const tokenAddress = contract.contractAddresses["token"]["address"];

        const tokenContract = new this.state.web3.eth.Contract(
            compTokenContract,
            tokenAddress
        );

        try {
            const gasPrice = await this.getGasPrice();

            await tokenContract.methods
                .delegate(this.state.delegateeAddress)
                .send(
                    { from: this.state.account, gasPrice: gasPrice },
                    (err, transactionHash) => {
                        // this.setState({
                        //   firetext: "Transaction Pending ...",
                        //   firetextShow: true,
                        // });
                        this.setProgress([1, 2]);
                        this.setMessage(
                            "Transaction Pending...",
                            transactionHash
                        );
                        console.log("Transaction Pending...", transactionHash);
                    }
                )
                .on("confirmation", (number, receipt) => {
                    if (number === 1) {
                        this.setMessage(
                            "Transaction Confirmed!",
                            receipt.transactionHash
                        );
                        console.log(
                            "Transaction Confirmed!",
                            receipt.transactionHash
                        );
                        this.readDelegateEvents(receipt);
                        // this.setState({
                        //   firetext: "Transaction Confirmed!",
                        //   firetextShow: true,
                        // });
                        this.setProgress([1, 2, 3]);
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
                    // this.setState({
                    //   firetext: "Could not delegate. Please try again.",
                    //   firetextShow: true,
                    // });
                    this.setProgress([1, 2, 3, 4]);
                    console.log("Transaction Failed!");
                });

            console.log("Delegated to: ", this.state.delegateeAddress);
        } catch (error) {
            // this.setState({
            //   firetext: "Could not delegate.",
            //   firetextShow: true,
            // });
            console.error("Error in delegate method: ", error);
        }
    };

    readDelegateEvents = async (receipt) => {
        try {
            let address1Changes = null;
            let address2Changes = null;
            let delegationChanges;

            console.log("Event Receipts: ", receipt);

            if (Array.isArray(receipt.events.DelegateVotesChanged)) {
                address1Changes = {
                    address:
                        receipt.events.DelegateVotesChanged[0].returnValues
                            .delegate,
                    prevValue:
                        receipt.events.DelegateVotesChanged[0].returnValues
                            .previousBalance,
                    newValue:
                        receipt.events.DelegateVotesChanged[0].returnValues
                            .newBalance,
                };

                address2Changes = {
                    address:
                        receipt.events.DelegateVotesChanged[1].returnValues
                            .delegate,
                    prevValue:
                        receipt.events.DelegateVotesChanged[1].returnValues
                            .previousBalance,
                    newValue:
                        receipt.events.DelegateVotesChanged[1].returnValues
                            .newBalance,
                };
            } else {
                address1Changes = {
                    address:
                        receipt.events.DelegateVotesChanged.returnValues
                            .delegate,
                    prevValue:
                        receipt.events.DelegateVotesChanged.returnValues
                            .previousBalance,
                    newValue:
                        receipt.events.DelegateVotesChanged.returnValues
                            .newBalance,
                };
            }

            delegationChanges =
                receipt.events.DelegateChanged.returnValues.toDelegate;

            console.log("Address 1 Changes: ", address1Changes);
            console.log("Address 2 Changes: ", address2Changes);
            console.log("Delegation Changes: ", delegationChanges);

            let newAddress = "Unknown";
            let power = "-1";
            if (address1Changes && address2Changes) {
                if (address1Changes.address === this.state.account) {
                    this.setState({
                        votingPower: address1Changes.newValue,
                    });
                    power = address1Changes.newValue;
                } else if (address2Changes.address === this.state.account) {
                    this.setState({
                        votingPower: address2Changes.newValue,
                    });
                    power = address2Changes.newValue;
                }
            } else {
                if (address1Changes.address === this.state.account) {
                    this.setState({
                        votingPower: address1Changes.newValue,
                    });
                    power = address1Changes.newValue;
                }
            }
            if (power !== "-1" && power === "0") {
                this.setState({ disableButtons: true });
                this.setState({
                    disableMessage: "You don't have voting power",
                });
            } else {
                this.setState({ disableButtons: false });
                this.setState({ disableMessage: "" });
            }
            newAddress = delegationChanges;

            if (newAddress === this.state.account) {
                this.setState({ delegatedAddress: "Self" });
            } else if (
                newAddress === "0x0000000000000000000000000000000000000000"
            ) {
                this.setState({ delegatedAddress: "Not yet delegated" });
            } else {
                this.setState({ delegatedAddress: newAddress });
            }
        } catch (error) {
            console.error(error);
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
        let convertedAddress = `${evt.target.value.slice(
            0,
            3
        )}...${evt.target.value.slice(
            evt.target.value.length - 4,
            evt.target.value.length
        )}`;
        this.setState({
            convertedAddress,
        });
        console.log(this.state.delegateeAddress);
    };

    updateCurrentPage = (data) => {
        this.setState({ page: data });
    };

    render() {
        return (
            <div className="app">
                {/* {this.state.firetextShow && (
          <Status
            hidestatus={this.hideLoader}
            firetext={this.state.firetext}
          ></Status>
        )} */}
                <Nav
                    {...this.state}
                    onConnect={this.onConnect}
                    disconnect={this.disconnect}
                    updateCurrentPage={this.updateCurrentPage}
                    currentPage={this.state.page}
                />
                <div className="tabcontainer">
                    <div className="tabs">
                        {this.state.page === "page__proposals" && (
                            <div id="page__proposals">
                                {this.state.firetextShow && (
                                    <ProgressBar
                                        processStage={this.state.processStage}
                                        firetext={this.state.firetext}
                                        setStatus={this.setStatusOf}
                                    />
                                )}
                                <Header
                                    {...this.state}
                                    delegate={this.delegate}
                                    updateDelegateeAddress={
                                        this.updateDelegateeAddress
                                    }
                                    convertedAddress={
                                        this.state.convertedAddress
                                    }
                                    setStatus={this.setStatusOf}
                                    setProgress={this.setProgress}
                                    disableButtons={this.state.disableButtons}
                                    disableMessage={this.state.disableMessage}
                                    getGasPrice={this.getGasPrice}
                                    fryGfryMod={this.fryGfryMod}
                                    onConnect={this.onConnect}
                                    stateprops={this.state}
                                    processStage={this.processStage}
                                    numberWithCommas={this.numberWithCommas}
                                />
                                <div>
                                    <Proposals
                                        {...this.state}
                                        xhr={this.xhr}
                                        setMessage={this.setMessage}
                                        clearMessage={this.clearMessage}
                                        getLatestBlock={this.getLatestBlock}
                                        getBlockTimeStamp={
                                            this.getBlockTimeStamp
                                        }
                                        getNetworkName={this.getNetworkName}
                                        numberWithCommas={this.numberWithCommas}
                                        buttonsDisabled={
                                            this.state.disableButtons
                                        }
                                        getGasPrice={this.getGasPrice}
                                        setStatusOf={this.setStatusOf}
                                    />
                                </div>
                            </div>
                        )}
                        {this.state.page ===
                            "page__create_payment_proposal" && (
                            <div id="page__create_payment_proposal">
                                <CustomHeader title="Create Payment Proposal"></CustomHeader>
                                <CreateProposalForm
                                    setStatusOf={this.setStatusOf}
                                    setMessage={this.setMessage}
                                    clearMessage={this.clearMessage}
                                    getLatestBlock={this.getLatestBlock}
                                    getTreasuryBalance={this.getTreasuryBalance}
                                    getGasPrice={this.getGasPrice}
                                    disableButtons={this.disableButtons}
                                    {...this.state}
                                ></CreateProposalForm>
                            </div>
                        )}
                        {this.state.page === "page__create_custom_proposal" && (
                            <div id="page__create_custom_proposal">
                                <CustomHeader title="Create Custom Proposal"></CustomHeader>
                                <CreateCustomProposalForm
                                    setStatusOf={this.setStatusOf}
                                    setMessage={this.setMessage}
                                    clearMessage={this.clearMessage}
                                    getGasPrice={this.getGasPrice}
                                    disableButtons={this.disableButtons}
                                    getLatestBlock={this.getLatestBlock}
                                    {...this.state}
                                ></CreateCustomProposalForm>
                            </div>
                        )}
                    </div>
                </div>
                <Footer {...this.state} />
            </div>
        );
    }
}

export default App;
