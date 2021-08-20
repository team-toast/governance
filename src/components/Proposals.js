import React, { Component } from "react";

import Proposal from "./Proposal";
import "../layout/components/proposals.sass";
import contract from "../contracts/GovernorAlpha.json";

class Proposals extends Component {
  constructor(props) {
    super(props);

    this.state = {
      proposals: [],
      loadedProposals: false,
      timeout: 0,
    };
  }

  sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

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
          this.getStatus2(proposalObjs[i]),
          this.isDaiProposal(eventDetail[5], eventDetail[2]).toString(),
        ]);
      }
      console.log("Proposal array: ", tmpProposals);
      this.setState({ proposals: tmpProposals });

      if (tmpProposals.length > 0) {
        this.setState({ loadedProposals: true });
      }
    } catch (error) {
      console.error("Error in getProposalsFromEvents", error);
    }
  };

  isDaiProposal = (calldata, contractAddress) => {
    if (
      calldata.length === 1 &&
      contractAddress
        .toString()
        .includes(contract["contractAddresses"]["forwarder"]["address"])
    ) {
      if (
        calldata[0]
          .toString()
          .includes(contract["contractAddresses"]["forwarder"]["forwardSig"]) &&
        calldata[0]
          .toString()
          .includes(contract["contractAddresses"]["dai"]["transferSig"]) &&
        calldata[0]
          .toString()
          .includes(contract["contractAddresses"]["dai"]["address"].slice(2))
      ) {
        return true;
      }
    }
    return false;
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
  getStatus2 = (proposal) => {
    if (proposal["canceled"] === true) {
      return "Canceled";
    } else if (this.latestBlock <= proposal["startBlock"]) {
      return "Pending";
    } else if (this.latestBlock <= proposal["endBlock"]) {
      return "Active";
    } else if (
      proposal["forVotes"] <= proposal["againstVotes"] ||
      proposal["votesFor"] <= 400000
    ) {
      return "Defeated";
    } else if (proposal["eta"] === "0") {
      return "Succeeded";
    } else if (proposal["executed"] === true) {
      return "Executed";
    } else if (this.latestBlock >= proposal["eta"] + 1209600) {
      return "Expired";
    } else {
      return "Queued";
    }
  };

  // getStatus = async (proposalId, web3) => {
  //   let proposalState = "";
  //   const tokenAddress = "0xd9FDa03E4dD889484f8556dDb00Ca114e6A1f575"; //contract.contractAddresses["networks"]["137"];

  //   const tokenContract = new web3.eth.Contract(
  //     GovernorAlphaContract.abi,
  //     tokenAddress
  //   );
  //   const retries = 5;
  //   let tryCount = 0;
  //   let stateUpdated = false;
  //   while (tryCount < retries && stateUpdated === false) {
  //     try {
  //       proposalState = await tokenContract.methods.state(proposalId).call();
  //       stateUpdated = true;
  //     } catch (error) {
  //       console.error("Error getting proposalState: ", error);
  //       tryCount++;
  //       proposalState = 8;
  //     }
  //   }
  //   return proposalState;
  // };

  componentDidMount = () => {
    let id = setInterval(() => {
      if (this.state.loadedProposals === true) {
        clearInterval(id);
      }
      this.getProposals();
      console.log(this.state.loadedProposals);
    }, 2000);
  };

  getProposals = async () => {
    try {
      console.log("Getting Proposals");
      if (this.props.network === "Matic") {
        console.log("Populating Matic proposal data.");
        this.getProposalsFromEvents(this.props.web3);
      } else {
        console.log("Please select the Matic network.");
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
              isDai={proposal[10]}
              {...this.props}
            />
          );
        }
      });

    return <section className="proposals">{proposals.reverse()}</section>;
  }
}

export default Proposals;
