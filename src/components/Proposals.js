import React, { Component } from "react";

import Proposal from "./Proposal";
import "../layout/components/proposals.sass";
import contract from "../contracts/GovernorAlpha.json";
import timelockContract from "../contracts/timelock.json";

class Proposals extends Component {
  constructor(props) {
    super(props);

    this.state = {
      proposals: [],
      loadedProposals: false,
      timeout: 0,
    };
  }

  getProposalsFromEvents = async (web3) => {
    try {
      let proposalObjs = await this.getAllProposalObjects(web3);
      console.log("Events: ");

      let eventDetail;
      let tmpProposals = [];
      for (let i = proposalObjs.length - 5; i < proposalObjs.length; i++) {
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
          proposalObjs[i]["forVotes"],
          proposalObjs[i]["againstVotes"],
          proposalObjs[i]["endBlock"],
          this.getProposalEndTime(proposalObjs[i]["endBlock"]),
          await this.getStatus2(proposalObjs[i], web3),
          this.isPaymentProposal(eventDetail[5], eventDetail[2]),
        ]);
      }
      console.log("Proposal array: ", tmpProposals);
      this.setState({ proposals: tmpProposals });

      if (tmpProposals.length > 0) {
        this.setState({ loadedProposals: true });
        return 0;
      }
    } catch (error) {
      console.error("Error in getProposalsFromEvents", error);
      return 1;
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
      let extratedReceiverAddress = calldata[0].slice(
        receiverAddressStartIndex,
        receiverAddressEndIndex
      );
      let extratedTokenAmount = calldata[0].slice(
        daiAmountStartIndex,
        daiAmountEndIndex
      );

      if (
        extractedForwardMethodSig ===
          contract["contractAddresses"]["forwarder"]["forwardSig"].slice(2) &&
        extratedTransferMethodSig ===
          contract["contractAddresses"]["dai"]["transferSig"].slice(2) &&
        extractedTokenAddress.slice(24) === paymentTokenAddress.slice(2)
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
    try {
      const govAlpha = new web3.eth.Contract(
        contract.abi,
        contract["networks"]["137"]["address"]
      );
      let numOfProposals = await govAlpha.methods.proposalCount().call();

      let proposals = [];
      let tmpProposal;
      for (let i = 0; i < numOfProposals; i++) {
        tmpProposal = await govAlpha.methods.proposals(i + 1).call();
        proposals.push(tmpProposal);
      }
      console.log("Proposal Objects: ");
      proposals.forEach((element) => {
        console.log(element);
      });
      return proposals;
    } catch (error) {
      console.error("Error in getAllProposalObjects: ", error);
    }
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

  // get state Solidity code (translated to JS in getState2 function)
  // function state(uint proposalId) public view returns (ProposalState) {
  //       require(proposalCount >= proposalId && proposalId > 0, "GovernorAlpha::state: invalid proposal id");
  //       Proposal storage proposal = proposals[proposalId];
  //       if (proposal.canceled) {
  //           return ProposalState.Canceled;
  //       } else if (block.number <= proposal.startBlock) {
  //           return ProposalState.Pending;
  //       } else if (block.number <= proposal.endBlock) {
  //           return ProposalState.Active;
  //       } else if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < quorumVotes()) {
  //           return ProposalState.Defeated;
  //       } else if (proposal.eta == 0) {
  //           return ProposalState.Succeeded;
  //       } else if (proposal.executed) {
  //           return ProposalState.Executed;
  //       } else if (block.timestamp >= add256(proposal.eta, timelock.GRACE_PERIOD())) {
  //           return ProposalState.Expired;
  //       } else {
  //           return ProposalState.Queued;
  //       }
  //   }
  getStatus2 = async (proposal, web3) => {
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
      proposal["votesFor"] <= (await this.getQuorumVotes(web3))
    ) {
      return "Defeated";
    } else if (proposal["eta"] === "0") {
      return "Succeeded";
    } else if (proposal["executed"] === true) {
      return "Executed";
    } else if (
      parseInt(this.props.latestBlock) >=
      proposal["eta"] + (await this.getGracePeriod(web3))
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
  };

  sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  getProposals = async () => {
    try {
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
          await this.sleep(5000);
        }
      }
    } catch (error) {
      console.log("Error in getProposals", error);
    }
  };

  getProposalEndTime = (expiryBlock) => {
    let expiryDate = new Date();
    console.log("Current date: ", expiryDate.toString());
    console.log("Expiry block", parseInt(expiryBlock));
    console.log("Latest block", this.props.latestBlock);
    let blockDifference =
      parseInt(expiryBlock) - parseInt(this.props.latestBlock);
    if (blockDifference < 0) {
      return "Closed";
    }
    console.log("Block Difference: ", blockDifference.toString());
    let secondsTillExpiry = 2.7 * blockDifference;
    expiryDate.setSeconds(
      expiryDate.getSeconds() + parseInt(secondsTillExpiry)
    );

    return expiryDate.toString();
  };

  render() {
    let proposals = [];

    this.state.proposals[0] !== undefined &&
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
              endDate={proposal[8]}
              status={proposal[9]}
              isPayment={proposal[10]}
              {...this.props}
            />
          );
        }
      });

    return <section className="proposals">{proposals.reverse()}</section>;
  }
}

export default Proposals;
