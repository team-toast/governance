import React, { Component } from "react";

import Proposal from "./Proposal";
//import "../layout/components/proposals.sass";
import contract from "../contracts/GovernorAlpha.json";
import timelockContract from "../contracts/timelock.json";
import Dai from "../contracts/Dai.json";
import Forwarder from "../contracts/Forwarder.json";
import Pager from "../components/Pager";
import CurrentPage from "./CurrentPage";

class Proposals extends Component {
    constructor(props) {
        super(props);

        this.state = {
            proposals: [],
            proposalObjects: [],
            proposalEvents: [],
            proposalStartTimes: [],
            proposalEndTimes: [],
            proposalStartTimesWithID: [],
            proposalEndTimesWithID: [],
            loadedProposals: false,
            timeout: 0,
            pageBookmark: 5,
            numberOfProposals: 0,
            proposalsPerPage: 5,
            newerButtonDisable: true,
            olderButtonDisable: false,
            historicBlockTimes: [],
            avgBlockTime: null,
            zeroProposals: false,
            proposalSearchStart: 8000000,
        };
    }

    refresh = () => {
        this.setState({ proposals: [] });
        this.props.getLatestBlock();
        this.getProposals();
    };

    next = () => {
        this.setState({ proposals: [] });
        let tmpBookmark = this.state.pageBookmark + this.state.proposalsPerPage;
        this.setState({ pageBookmark: tmpBookmark });
        this.refresh();
    };

    back = () => {
        let tmpBookmark = this.state.pageBookmark - this.state.proposalsPerPage;
        this.setState({ proposals: [] });
        this.setState({ pageBookmark: tmpBookmark });
        this.refresh();
    };

    timestampToDate = (timestamp) => {
        let date = new Date(timestamp * 1000);

        return this.formatDate(date);
    };

    getProposalsFromEvents = async (web3) => {
        let fectchedProposalObjects = false;

        while (fectchedProposalObjects === false) {
            try {
                let proposalObjs = await this.getAllProposalObjects(web3);
                this.setState({ proposalObjects: proposalObjs });
                // console.log("Set objects");

                let quorumVotes = await this.getQuorumVotes(web3);
                let gracePeriod = await this.getGracePeriod(web3);

                let tmpProposals = [];

                // console.log(
                //   "Events Bookmark Start: ",
                //   proposalObjs.length - this.state.pageBookmark
                // );
                // console.log(
                //   "Events Bookmark End: ",
                //   proposalObjs.length -
                //     this.state.pageBookmark +
                //     this.state.proposalsPerPage
                // );

                let start = 0;
                if (proposalObjs.length - this.state.pageBookmark < 0) {
                    start = 0;
                } else {
                    start = proposalObjs.length - this.state.pageBookmark;
                }

                let blockNumbers = [];
                let Ids = [];
                let ethBlockTimestamps = [];
                for (let i = start; i < proposalObjs.length; i++) {
                    blockNumbers.unshift(
                        parseInt(proposalObjs[i]["startBlock"]) - 1
                    );
                    Ids.unshift(proposalObjs[i]["id"]);
                    ethBlockTimestamps.unshift(
                        await this.props.getBlockTimeStamp(
                            proposalObjs[i]["startBlock"] - 1
                        )
                    );
                }

                //console.log("blocknumbers: ", blockNumbers);
                //console.log("proposalObjs: ", proposalObjs);
                // console.log("Ids: ", Ids);

                this.getProposalEventParametersBatch(
                    web3,
                    blockNumbers,
                    Ids,
                    ethBlockTimestamps
                );

                for (let i = start; i < proposalObjs.length; i++) {
                    // eventDetail = await this.getProposalEventParameters(
                    //   web3,
                    //   parseInt(proposalObjs[i]["startBlock"]) - 1,
                    //   proposalObjs[i]["id"]
                    // );
                    // console.log(eventDetail);
                    this.addDateToArray(
                        true,
                        proposalObjs[i]["startBlock"],
                        proposalObjs[i]["id"]
                    );
                    this.addDateToArray(
                        false,
                        proposalObjs[i]["endBlock"],
                        proposalObjs[i]["id"]
                    );
                    tmpProposals.push({
                        title: "Proposal " + parseInt(proposalObjs[i]["id"]),
                        description: "Loading...",

                        id: parseInt(proposalObjs[i]["id"]),

                        endBlock: parseInt(proposalObjs[i]["endBlock"]),

                        forVotes: this.props.numberWithCommas(
                            parseFloat(
                                this.props.web3.utils.fromWei(
                                    proposalObjs[i]["forVotes"]
                                )
                            ).toFixed(2)
                        ),

                        againstVotes: this.props.numberWithCommas(
                            parseFloat(
                                this.props.web3.utils.fromWei(
                                    proposalObjs[i]["againstVotes"]
                                )
                            ).toFixed(2)
                        ),

                        endTime: "Loading...", // await this.getProposalTimeFromBlock(
                        //proposalObjs[i]["endBlock"]
                        //),

                        status: await this.getStatus2(
                            proposalObjs[i],
                            web3,
                            quorumVotes,
                            gracePeriod
                        ),

                        //isPayment: this.isPaymentProposal(eventDetail[5], eventDetail[2]),

                        isPayment: [false, 0, "", ""],
                        startBlock: proposalObjs[i]["startBlock"],

                        startTime: "Loading...", // await this.getProposalTimeFromBlock(
                        // proposalObjs[i]["startBlock"]
                        //),
                    });

                    // TODO add start and end times to state arrays

                    //console.log("")
                }

                fectchedProposalObjects = true;
                // console.log("Proposal array: ", tmpProposals);
                this.setState({ proposals: tmpProposals });

                if (tmpProposals.length > 0) {
                    this.setState({ loadedProposals: true });
                    return 0;
                }
            } catch (error) {
                console.error("Error in getProposalsFromEvents", error);
                await this.sleep(1000);
            }
        }
    };

    addDateToArray = async (start, block, id) => {
        if (start) {
            let time = await this.getProposalTimeFromBlock(block);
            let timeAndID = { id: id, time: time };
            this.setState({
                proposalStartTimes: this.state.proposalStartTimes.concat(time),
            });
            this.setState({
                proposalStartTimesWithID:
                    this.state.proposalStartTimesWithID.concat(timeAndID),
            });
        } else {
            let time = await this.getProposalTimeFromBlock(block);
            let timeAndID = { id: id, time: time };
            this.setState({
                proposalEndTimes: this.state.proposalEndTimes.concat(time),
            });
            this.setState({
                proposalEndTimesWithID:
                    this.state.proposalEndTimesWithID.concat(timeAndID),
            });
        }
    };

    getProposalEventParametersBatch = async (
        web3,
        blockNumbers,
        Ids,
        ethTimeStamps
    ) => {
        const batch = new web3.eth.BatchRequest();
        //console.log("BLOCK NUMBERS: ", blockNumbers);
        //console.log("TIME STAMP: ", ethTimeStamps);

        for (let i = 0; i < blockNumbers.length; i++) {
            batch.add(this.searchForPastEvents(web3, ethTimeStamps[i]));
        }
    };

    processEvent = async (err, data) => {
        // console.log("Processing Event");
        if (!data) {
            return;
        }
        if (data.length !== 0) {
            for (let i = 0; i < data.length; i++) {
                let rawData = data[i]["raw"]["data"];
                // console.log("Data length: ", data.length);
                try {
                    let decoded = this.props.web3.eth.abi.decodeParameters(
                        [
                            "uint256",
                            "address",
                            "address[]",
                            "uint256[]",
                            "string[]",
                            "bytes[]",
                            "uint256",
                            "uint256",
                            "string",
                        ],
                        rawData
                    );
                    //console.log("DATA: ", data);
                    //console.log("DECODED: ", decoded);
                    this.setState({
                        proposalEvents:
                            this.state.proposalEvents.concat(decoded),
                    });
                    //console.log("Events found: ", this.state.proposalEvents);
                } catch (error) {
                    //console.log("Error in processEvent: ", error);
                }
            }
        }
    };

    searchForPastEvents = async (web3, targetTimestamp) => {
        while (1) {
            try {
                let higherLimitStamp = targetTimestamp + 10000; // About 3300 blocks overshoot
                let lowerLimitStamp = targetTimestamp - 10000;

                // decreasing average block size will decrease precision and also
                // decrease the amount of requests made in order to find the closest
                // block
                let averageBlockTime = 3.5 * 1.0;

                // get current block number
                const currentBlockNumber = await web3.eth.getBlockNumber();
                //console.log("Using current block number: ", currentBlockNumber);
                let block = await web3.eth.getBlock(currentBlockNumber);

                let requestsMade = 0;

                let blockNumber = currentBlockNumber;

                while (block.timestamp > targetTimestamp) {
                    let decreaseBlocks =
                        (block.timestamp - targetTimestamp) / averageBlockTime;
                    decreaseBlocks = parseInt(decreaseBlocks);

                    // console.log("Decreasing blocks by: ", decreaseBlocks);

                    if (decreaseBlocks < 1000) {
                        break;
                    }

                    blockNumber -= decreaseBlocks;

                    block = await web3.eth.getBlock(blockNumber);
                    requestsMade += 1;
                }

                // if we undershoot the day
                if (block.timestamp < lowerLimitStamp) {
                    while (block.timestamp < lowerLimitStamp) {
                        blockNumber += 2000;
                        //console.log("UnderShot target, adding to block number");
                        block = await web3.eth.getBlock(blockNumber);
                        requestsMade += 2000;
                    }
                }

                if (block.timestamp >= higherLimitStamp) {
                    while (block.timestamp >= higherLimitStamp) {
                        blockNumber -= 2000;

                        block = await web3.eth.getBlock(blockNumber);
                        requestsMade += 1;
                    }
                }

                // console.log("tgt timestamp   ->", targetTimestamp);
                // console.log("block timestamp ->", block.timestamp);
                // console.log("block number    ->", block);
                // console.log("");

                console.log("requests made   ->", requestsMade);

                const govAlpha = new web3.eth.Contract(
                    contract.abi,
                    this.props.appConfig["contractAddresses"]["governorAlpha"]
                );

                govAlpha.getPastEvents(
                    0xda95691a, // method id
                    {
                        fromBlock: block.number - 5000,
                        toBlock: block.number + 5000,
                    },
                    this.processEvent
                );

                return block.number;
            } catch (error) {
                console.error("Something exploded here");
                await this.sleep(200);
            }
        }
    };

    // getAverageBlockTime = async (web3) => {
    //     const n = 25;
    //     const latest = await web3.eth.getBlockNumber();
    //     const blockNumbers = this.createArrayWithRange(
    //         latest - n,
    //         latest + 1,
    //         1
    //     );
    //     const batch = new web3.eth.BatchRequest();

    //     blockNumbers.forEach((blockNumber) => {
    //         batch.add(
    //             web3.eth.getBlock.request(blockNumber, this.storeLocalCopy)
    //         );
    //     });

    //     batch.execute();
    // };

    storeLocalCopy = (err, data) => {
        if (err === null) {
            this.setState({
                historicBlockTimes: this.state.historicBlockTimes.concat([
                    data["timestamp"],
                ]),
            });
        }
    };

    isPaymentProposal = (
        calldata,
        contractAddress,
        paymentTokenAddress = this.props.appConfig["contractAddresses"][
            "daiAddress"
        ],
        tokenName = "Dai"
    ) => {
        const expectedCalldataLength = 458;

        const forwardMethodSigStartIndex = 2;
        const forwardMethodSigEndIndex = 10;

        const daiAddressStartIndex = 10;
        const daiAddressEndIndex = 74;

        const transferMethodSigStartIndex = 266;
        const transferMethodSigEndIndex = 274;

        const receiverAddressStartIndex = 298;
        const receiverAddressEndIndex = 338;

        const daiAmountStartIndex = 345;
        const daiAmountEndIndex = 402;

        const generatedDaiTransferCallData =
            this.props.web3.eth.abi.encodeFunctionCall(
                Dai.find((el) => el.name === "transfer"),
                [
                    // fake address because receiver addresses are not checked
                    "0x0000000000000000000000000000000000000000",
                    // can be an arbitrary amount because the amount is also not checked
                    this.props.web3.utils.toWei("1").toString(16),
                ]
            );

        const generatedForwardCallData =
            this.props.web3.eth.abi.encodeFunctionCall(
                Forwarder.find((el) => el.name === "forward"),
                [paymentTokenAddress, generatedDaiTransferCallData, "0"]
            );

        if (
            calldata.length === 1 &&
            contractAddress
                .toString()
                .toLowerCase()
                .includes(
                    this.props.appConfig["contractAddresses"][
                        "treasuryForwarder"
                    ].toLowerCase()
                ) &&
            calldata[0].length === expectedCalldataLength
        ) {
            let extractedForwardMethodSig = calldata[0].slice(
                forwardMethodSigStartIndex,
                forwardMethodSigEndIndex
            );
            let extractedTokenAddress = calldata[0].slice(
                daiAddressStartIndex,
                daiAddressEndIndex
            );
            let extratedTransferMethodSig = calldata[0].slice(
                transferMethodSigStartIndex,
                transferMethodSigEndIndex
            );
            let generatedForwardMethodSig = generatedForwardCallData.slice(
                forwardMethodSigStartIndex,
                forwardMethodSigEndIndex
            );
            let generatedTokenAddress = generatedForwardCallData.slice(
                daiAddressStartIndex,
                daiAddressEndIndex
            );
            let generatedTransferMethodSig = generatedForwardCallData.slice(
                transferMethodSigStartIndex,
                transferMethodSigEndIndex
            );

            let extratedReceiverAddress = calldata[0].slice(
                receiverAddressStartIndex,
                receiverAddressEndIndex
            );
            let extratedTokenAmount = calldata[0].slice(
                daiAmountStartIndex,
                daiAmountEndIndex
            );

            if (
                extractedForwardMethodSig === generatedForwardMethodSig &&
                extratedTransferMethodSig === generatedTransferMethodSig &&
                extractedTokenAddress === generatedTokenAddress
            ) {
                //Decode Token amount and receiver
                let amount = "";
                let receiver = "";
                amount = parseInt("0x" + extratedTokenAmount, 16) / 10 ** 18;
                receiver = extratedReceiverAddress;
                //console.log("This is a PAYMENT");
                return [true, amount, receiver, tokenName, "", ""];
            } else {
                //console.log("This is NOT a PAYMENT");
                return [false, 0, "", "", contractAddress, calldata];
            }
        }
        // TODO format array data for output
        if (calldata.length > 1) {
            let contractAddresses = "";
            let calldatas = "";
            for (let i = 0; i < contractAddress.length; i++) {
                if (i === 0) {
                    contractAddresses = contractAddress[i];
                    calldatas = calldata[i];
                } else {
                    contractAddresses =
                        contractAddresses + ", " + contractAddress[i];
                    calldatas = calldatas + ", " + calldata[i];
                }
            }
            return [false, 0, "", "", contractAddresses, calldatas];
        }
        return [false, 0, "", "", contractAddress, calldata];
    };

    getAllProposalObjects = async (web3) => {
        const govAlpha = new web3.eth.Contract(
            contract.abi,
            this.props.appConfig["contractAddresses"]["governorAlpha"]
        );
        let numOfProposals = await govAlpha.methods.proposalCount().call();
        if (numOfProposals === "0") {
            this.setState({ zeroProposals: true });
            console.log("ZERO PROPOSALS");
        }

        this.setState({ numberOfProposals: numOfProposals });
        let proposals = [];
        let tmpProposal;

        let start = 0;
        if (numOfProposals - this.state.pageBookmark < 0) {
            start = 0;
        } else {
            start = numOfProposals - this.state.pageBookmark;
        }
        for (
            let i = start;
            i <
            numOfProposals -
                this.state.pageBookmark +
                this.state.proposalsPerPage;
            i++
        ) {
            tmpProposal = await govAlpha.methods.proposals(i + 1).call();
            proposals.push(tmpProposal);
        }
        return proposals;
    };

    getStatus2 = async (proposal, web3, quorumVotes, gracePeriod) => {
        if (proposal["canceled"] === true) {
            return "Canceled";
        } else if (
            parseInt(this.props.latestBlock) <= parseInt(proposal["startBlock"])
        ) {
            return "Pending";
        } else if (
            parseInt(this.props.latestBlock) <= parseInt(proposal["endBlock"])
        ) {
            return "Active";
        } else if (
            proposal["forVotes"] <= proposal["againstVotes"] ||
            proposal["votesFor"] <= quorumVotes
        ) {
            return "Defeated";
        } else if (proposal["eta"] === "0") {
            return "Succeeded";
        } else if (proposal["executed"] === true) {
            return "Executed";
        } else if (
            parseInt(this.props.latestBlock) >=
            proposal["eta"] + gracePeriod
        ) {
            return "Expired";
        } else {
            return "Queued";
        }
    };

    getQuorumVotes = async (web3) => {
        const govAlpha = new web3.eth.Contract(
            contract.abi,
            this.props.appConfig["contractAddresses"]["governorAlpha"]
        );
        let quorumVotes;
        try {
            quorumVotes = await govAlpha.methods.quorumVotes().call();
        } catch (error) {
            console.error("Error in getQuorumVotes: ", error);
            return 40000 * 10 ** 18;
        }
        return quorumVotes;
    };

    getGracePeriod = async (web3) => {
        const timelock = new web3.eth.Contract(
            timelockContract,
            this.props.appConfig["contractAddresses"]["timelock"]
        );
        let gracePeriod;
        try {
            gracePeriod = await timelock.methods.GRACE_PERIOD().call();
        } catch (error) {
            console.error("Error in getGracePeriod: ", error);
            return 1209600;
        }
        return gracePeriod;
    };

    componentDidMount = () => {
        setTimeout(
            function () {
                //Start the timer

                this.getProposals();
            }.bind(this),
            1000
        );

        // setInterval(() => {
        //   if (this.props.network === "Matic") {
        //     console.log("StartTimes: ", this.state.proposalStartTimesWithID);
        //     console.log("EndTimes: ", this.state.proposalEndTimesWithID);
        //   }
        // }, 5000);
    };

    sleep = (milliseconds) => {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    };

    getProposals = async () => {
        try {
            let arbitrum = false;
            while (arbitrum === false) {
                //console.log("Getting Proposals");
                if (this.props.network === "Arbitrum") {
                    //console.log("Populating Arbitrum proposal data.");
                    arbitrum = true;
                    this.getProposalsFromEvents(this.props.web3);
                } else {
                    console.log("Please select the Arbitrum network.");
                    arbitrum = false;
                    await this.sleep(2000);
                }
            }
            // this.getAverageBlockTime(this.props.web3);
        } catch (error) {
            await this.sleep(1000);
            console.log("Error in getProposals", error);
        }
    };

    createArrayWithRange = (a, b) => {
        if (b === undefined) {
            b = a;
            a = 1;
        }
        return [...Array(b - a + 1).keys()].map((x) => x + a);
    };

    getAverageBlockTime = async (web3) => {
        try {
            const n = 25;
            const latest = await web3.eth.getBlockNumber();
            const blockNumbers = this.createArrayWithRange(
                latest - n,
                latest + 1,
                1
            );
            const batch = new web3.eth.BatchRequest();

            blockNumbers.forEach((blockNumber) => {
                batch.add(
                    web3.eth.getBlock.request(blockNumber, this.storeLocalCopy)
                );
            });

            batch.execute();
        } catch (error) {
            console.error("Error in getAverageBlockTime: ", error);
        }
    };

    storeLocalCopy = (err, data) => {
        if (err === null) {
            this.setState({
                historicBlockTimes: this.state.historicBlockTimes.concat([
                    data["timestamp"],
                ]),
            });
        }
    };

    getProposalTimeFromBlock = async (block) => {
        let timestamp = await this.props.getBlockTimeStamp(block);
        console.log("Block: ", block);
        console.log("timestamp in proposals 1:", timestamp);
        let expiryDate;
        let latestBlock = "";
        if (this.props.latestBlock === "") {
            latestBlock = this.props.getLatestBlock();
        } else {
            latestBlock = this.props.latestBlock;
        }

        if (timestamp !== 0) {
            expiryDate = this.timestampToDate(timestamp);
        } else {
            expiryDate = new Date();
            let blockDifference = parseInt(block) - parseInt(latestBlock);
            if (blockDifference < 0) {
                return "Closed on " + this.formatDate(expiryDate);
            }

            // console.log(
            //   "HISTORICAL BLOCKTIME LENGTH: ",
            //   this.state.historicBlockTimes.length
            // );
            // console.log("HISTORICAL BLOCKTIMES: ", this.state.historicBlockTimes);

            // Calculate average blocktime
            // let differences = [];
            // for (let i = 0; i < this.state.historicBlockTimes.length - 1; i++) {
            //   differences.push(
            //     this.state.historicBlockTimes[i + 1] -
            //       this.state.historicBlockTimes[i]
            //   );
            // }

            let avg = 13.1; // from https://polygonscan.com/chart/blocktime

            let secondsTillExpiry = avg * blockDifference;
            expiryDate.setSeconds(
                expiryDate.getSeconds() + parseInt(secondsTillExpiry)
            );
        }

        //console.log(449, expiryDate);

        const d = new Date(expiryDate);

        return this.formatDate(d);
    };

    formatDate = (d) => {
        const datevalues = [
            d.getFullYear(),
            d.getMonth() + 1,
            (d.getDate() < 10 ? "0" : "") + d.getDate(),
            (d.getHours() < 10 ? "0" : "") + d.getHours(),
            (d.getMinutes() < 10 ? "0" : "") + d.getMinutes(),
            (d.getSeconds() < 10 ? "0" : "") + d.getSeconds(),
        ];

        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        return `${months[datevalues[1] - 1]} ${datevalues[2]} ${
            datevalues[0]
        } ${datevalues[3]}:${datevalues[4]}:${datevalues[5]}`;
    };

    getDescription = (id) => {
        for (let i = 0; i < this.state.proposalEvents.length; i++) {
            if (this.state.proposalEvents[i][0] === id.toString()) {
                return this.state.proposalEvents[i][8];
            }
        }
        return "";
    };

    getIsPayment = (id) => {
        for (let i = 0; i < this.state.proposalEvents.length; i++) {
            if (this.state.proposalEvents[i][0] === id.toString()) {
                return this.isPaymentProposal(
                    this.state.proposalEvents[i][5],
                    this.state.proposalEvents[i][2]
                );
            }
        }
        return [false, 0, "", "", "", ""];
    };

    getTime = (start, id) => {
        if (start) {
            for (
                let i = 0;
                i < this.state.proposalStartTimesWithID.length;
                i++
            ) {
                if (
                    this.state.proposalStartTimesWithID[i]["id"] ===
                    id.toString()
                ) {
                    return this.state.proposalStartTimesWithID[i]["time"];
                }
            }
            return "";
        } else {
            for (let i = 0; i < this.state.proposalEndTimesWithID.length; i++) {
                if (
                    this.state.proposalEndTimesWithID[i]["id"] === id.toString()
                ) {
                    return this.state.proposalEndTimesWithID[i]["time"];
                }
            }
            return "";
        }
    };

    render() {
        let proposals = [];

        if (this.state.proposals[0] !== undefined) {
            let i = 0;
            this.state.proposals.forEach((proposal) => {
                if (proposal["title"] !== undefined) {
                    proposals.push(
                        <Proposal
                            title={proposal["title"]}
                            description={this.getDescription(proposal["id"])}
                            key={proposal["id"]}
                            id={proposal["id"]}
                            end={proposal["endBlock"]}
                            infavor={proposal["forVotes"]}
                            against={proposal["againstVotes"]}
                            endBlock={proposal["endBlock"]}
                            startBlock={proposal["startBlock"]}
                            startDate={this.getTime(true, proposal["id"])}
                            endDate={this.getTime(false, proposal["id"])}
                            status={proposal["status"]}
                            isPayment={this.getIsPayment(proposal["id"])}
                            updateProposalStates={this.getProposals}
                            buttonsDisabled={this.props.buttonsDisabled}
                            getGasPrice={this.props.getGasPrice}
                            setStatusOf={this.props.setStatusOf}
                            //setStatusOf={this.props.setProgress}
                            {...this.props}
                        />
                    );
                }
                i++;
            });
            return (
                <section className="proposals">
                    {" "}
                    <div className="proposal" style={{ marginTop: "-44px" }}>
                        <h4>
                            <CurrentPage
                                refresh={this.refresh}
                                next={this.next}
                                back={this.back}
                                numberOfProposals={this.state.numberOfProposals}
                                bookmark={this.state.pageBookmark}
                                proposalsPerPage={this.state.proposalsPerPage}
                                newerButtonDisable={
                                    this.state.newerButtonDisable
                                }
                                olderButtonDisable={
                                    this.state.olderButtonDisable
                                }
                            ></CurrentPage>
                        </h4>
                    </div>
                    {proposals.reverse()}
                    <Pager
                        refresh={this.refresh}
                        next={this.next}
                        back={this.back}
                        numberOfProposals={this.state.numberOfProposals}
                        bookmark={this.state.pageBookmark}
                        proposalsPerPage={this.state.proposalsPerPage}
                        newerButtonDisable={this.state.newerButtonDisable}
                        olderButtonDisable={this.state.olderButtonDisable}
                    ></Pager>
                </section>
            );
        } else {
            if (this.state.zeroProposals) {
                return (
                    <div className="proposals fetching-proposals">
                        <div
                            className="proposal"
                            style={{ marginTop: "-44px" }}
                        >
                            <h4>No proposals submitted yet</h4>
                        </div>
                    </div>
                );
            } else if (this.props.web3 === null) {
                return (
                    <div className="proposals fetching-proposals">
                        <div
                            className="proposal"
                            style={{ marginTop: "-44px" }}
                        >
                            <h4>Wallet Connection Requried</h4>
                        </div>
                    </div>
                );
            } else
                return (
                    <div className="proposals fetching-proposals">
                        <div
                            className="proposal"
                            style={{ marginTop: "-44px" }}
                        >
                            <h4>Fetching Proposals...</h4>
                        </div>
                        <div className="proposals-demo"></div>
                        <div className="proposals-demo"></div>
                    </div>
                );
        }
    }
}

export default Proposals;
