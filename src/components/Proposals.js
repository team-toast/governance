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
      loadedProposals: false,
      timeout: 0,
      pageBookmark: 3,
      numberOfProposals: 0,
      proposalsPerPage: 3,
      newerButtonDisable: true,
      olderButtonDisable: false,
      historicBlockTimes: [],
      avgBlockTime: null,
      zeroProposals: false,
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

    // let day = date.getDay();
    // let month = date.getMonth();
    // let year = date.getFullYear();
    // // Hours part from the timestamp
    // let hours = date.getHours();
    // // Minutes part from the timestamp
    // let minutes = "0" + date.getMinutes();
    // // Seconds part from the timestamp
    // let seconds = "0" + date.getSeconds();

    // // Will display time in 10:30:23 format
    // let formattedTime =
    //   day +
    //   "/" +
    //   month +
    //   "/" +
    //   year +
    //   " " +
    //   hours +
    //   ":" +
    //   minutes.substr(-2) +
    //   ":" +
    //   seconds.substr(-2);
  };

  getProposalsFromEvents = async (web3) => {
    let fectchedProposalObjects = false;
    while (fectchedProposalObjects === false) {
      try {
        let proposalObjs = await this.getAllProposalObjects(web3);
        console.log("Events: ");

        let quorumVotes = await this.getQuorumVotes(web3);
        let gracePeriod = await this.getGracePeriod(web3);

        let eventDetail;
        let tmpProposals = [];

        console.log(
          "Events Bookmark Start: ",
          proposalObjs.length - this.state.pageBookmark
        );
        console.log(
          "Events Bookmark End: ",
          proposalObjs.length -
            this.state.pageBookmark +
            this.state.proposalsPerPage
        );

        let start = 0;
        if (proposalObjs.length - this.state.pageBookmark < 0) {
          start = 0;
        } else {
          start = proposalObjs.length - this.state.pageBookmark;
        }

        for (let i = start; i < proposalObjs.length; i++) {
          //for (let i = 0; i < proposalObjs.length; i++) {
          eventDetail = await this.getProposalEventParameters(
            web3,
            parseInt(proposalObjs[i]["startBlock"]) - 1,
            proposalObjs[i]["id"]
          );
          console.log(eventDetail);
          // Title, description, id (key), id, end_time
          tmpProposals.push([
            "Proposal " + parseInt(eventDetail[0]),
            eventDetail[8],
            eventDetail[0],
            eventDetail[0],
            eventDetail[7],
            this.props.numberWithCommas(
              parseFloat(
                this.props.web3.utils.fromWei(proposalObjs[i]["forVotes"])
              ).toFixed(2)
            ),
            this.props.numberWithCommas(
              parseFloat(
                this.props.web3.utils.fromWei(proposalObjs[i]["againstVotes"])
              ).toFixed(2)
            ),
            proposalObjs[i]["endBlock"],
            await this.getProposalTimeFromBlock(proposalObjs[i]["endBlock"]),
            await this.getStatus2(
              proposalObjs[i],
              web3,
              quorumVotes,
              gracePeriod
            ),
            this.isPaymentProposal(eventDetail[5], eventDetail[2]),
            proposalObjs[i]["startBlock"],
            await this.getProposalTimeFromBlock(proposalObjs[i]["startBlock"]),
          ]);
        }
        fectchedProposalObjects = true;
        console.log("Proposal array: ", tmpProposals);
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

  isPaymentProposal = (
    calldata,
    contractAddress,
    paymentTokenAddress = contract["contractAddresses"]["dai"]["address"],
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

    const generatedForwardCallData = this.props.web3.eth.abi.encodeFunctionCall(
      Forwarder.find((el) => el.name === "forward"),
      [paymentTokenAddress, generatedDaiTransferCallData, "0"]
    );

    //console.log("Original call data: ", calldata);
    //console.log("Generated call data: ", generatedForwardCallData);

    if (
      calldata.length === 1 &&
      contractAddress
        .toString()
        .includes(contract["contractAddresses"]["forwarder"]["address"]) &&
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
        console.log("This is a PAYMENT");
        return [true, amount, receiver, tokenName];
      } else {
        return [false, 0, "", ""];
      }
    }
    return [false, 0, "", ""];
  };

  getAllProposalObjects = async (web3) => {
    const govAlpha = new web3.eth.Contract(
      contract.abi,
      contract["networks"]["137"]["address"]
    );
    let numOfProposals = await govAlpha.methods.proposalCount().call();
    if (numOfProposals === "0") {
      this.setState({ zeroProposals: true });
      console.log("ZERO PROPOSALS");
    }

    this.setState({ numberOfProposals: numOfProposals });
    let proposals = [];
    let tmpProposal;
    //for (let i = 0; i < numOfProposals; i++) {

    let start = 0;
    if (numOfProposals - this.state.pageBookmark < 0) {
      start = 0;
    } else {
      start = numOfProposals - this.state.pageBookmark;
    }

    console.log(
      "Objects Bookmark Start: ",
      numOfProposals - this.state.pageBookmark
    );
    console.log(
      "Objects Bookmark End: ",
      numOfProposals - this.state.pageBookmark + this.state.proposalsPerPage
    );
    for (
      let i = start;
      i <
      numOfProposals - this.state.pageBookmark + this.state.proposalsPerPage;
      i++
    ) {
      tmpProposal = await govAlpha.methods.proposals(i + 1).call();
      proposals.push(tmpProposal);
    }
    console.log("Proposal Objects: ");
    proposals.forEach((element) => {
      console.log(element);
    });
    return proposals;
  };

  getProposalEventParameters = async (web3, blockNumber, Id) => {
    const govAlpha = new web3.eth.Contract(
      contract.abi,
      contract["networks"]["137"]["address"]
    );
    let found = await govAlpha.getPastEvents(
      0xda95691a, // method id
      {
        filter: { id: Id },
        fromBlock: blockNumber - 10,
        toBlock: blockNumber,
      }
    );
    let rawData = found[0]["raw"]["data"];
    let decoded = web3.eth.abi.decodeParameters(
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

    return decoded;
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
      contract["networks"]["137"]["address"]
    );
    let quorumVotes;
    try {
      quorumVotes = await govAlpha.methods.quorumVotes().call();
    } catch (error) {
      console.error("Error in getQuorumVotes: ", error);
      return 40000 * 10 ** 18;
    }
    //console.log("QUORUM:", quorumVotes);
    return quorumVotes;
  };

  getGracePeriod = async (web3) => {
    const timelock = new web3.eth.Contract(
      timelockContract,
      contract["contractAddresses"]["timelock"]["address"]
    );
    let gracePeriod;
    try {
      gracePeriod = await timelock.methods.GRACE_PERIOD().call();
    } catch (error) {
      console.error("Error in getGracePeriod: ", error);
      return 1209600;
    }
    //console.log("gracePeriod:", gracePeriod);
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
    //     this.props.getLatestBlock();
    //     this.getProposals();
    //   }
    // }, 20000);
  };

  sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  getProposals = async () => {
    try {
      await this.getAverageBlockTime(this.props.web3);

      let matic = false;
      while (matic === false) {
        console.log("Getting Proposals");
        if (this.props.network === "Matic") {
          console.log("Populating Matic proposal data.");
          matic = true;
          await this.getProposalsFromEvents(this.props.web3);
        } else {
          console.log("Please select the Matic network.");
          matic = false;
          await this.sleep(2000);
        }
      }
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
    const n = 25;
    const latest = await web3.eth.getBlockNumber();
    const blockNumbers = this.createArrayWithRange(latest - n, latest + 1, 1);
    const batch = new web3.eth.BatchRequest();

    blockNumbers.forEach((blockNumber) => {
      batch.add(web3.eth.getBlock.request(blockNumber, this.storeLocalCopy));
    });

    batch.execute();
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
    let expiryDate;
    if (timestamp !== 0) {
      expiryDate = this.timestampToDate(timestamp);
    } else {
      expiryDate = new Date();
      //console.log("Current date: ", expiryDate.toString());
      //console.log("Expiry block", parseInt(block));
      //console.log("Latest block", this.props.latestBlock);
      let blockDifference = parseInt(block) - parseInt(this.props.latestBlock);
      if (blockDifference < 0) {
        return "Closed on " + this.formatDate(expiryDate);
      }
      //console.log("Block Difference: ", blockDifference.toString());

      let differences = [];
      for (let i = 0; i < this.state.historicBlockTimes.length - 1; i++) {
        differences.push(
          this.state.historicBlockTimes[i + 1] -
            this.state.historicBlockTimes[i]
        );
      }

      let avg = differences.reduce((a, b) => a + b, 0) / differences.length;

      //console.log("DIFFERENCES: ", differences);
      //console.log("AVERAGE: ", avg);

      let secondsTillExpiry = avg * blockDifference;
      expiryDate.setSeconds(
        expiryDate.getSeconds() + parseInt(secondsTillExpiry)
      );
    }

    console.log(449, expiryDate);

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

    return `${months[datevalues[1] - 1]} ${datevalues[2]} ${datevalues[0]} ${
      datevalues[3]
    }:${datevalues[4]}:${datevalues[5]}`;
  };

  render() {
    let proposals = [];

    if (this.state.proposals[0] !== undefined) {
      this.state.proposals.forEach((proposal) => {
        if (proposal[0].length > 0) {
          proposals.push(
            <Proposal
              title={proposal[0]}
              description={proposal[1]}
              key={proposal[2]}
              id={proposal[3]}
              end={proposal[4]}
              infavor={proposal[5]}
              against={proposal[6]}
              endBlock={proposal[7]}
              startBlock={proposal[11]}
              startDate={proposal[12]}
              endDate={proposal[8]}
              status={proposal[9]}
              isPayment={proposal[10]}
              updateProposalStates={this.getProposals}
              buttonsDisabled={this.props.buttonsDisabled}
              getGasPrice={this.props.getGasPrice}
              setStatusOf={this.props.setStatusOf}
              {...this.props}
            />
          );
        }
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
                newerButtonDisable={this.state.newerButtonDisable}
                olderButtonDisable={this.state.olderButtonDisable}
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
            <div className="proposal" style={{ marginTop: "-44px" }}>
              <h4>No proposals submitted yet</h4>
            </div>
          </div>
        );
      } else
        return (
          <div className="proposals fetching-proposals">
            <div className="proposal" style={{ marginTop: "-44px" }}>
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
