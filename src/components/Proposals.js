import React, { Component } from "react";

import Proposal from "./Proposal";
import GovernorAlphaContract from "../contracts/GovernorAlpha.json";
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
      for (let i = 0; i < proposalObjs.length; i++) {
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
          await this.getStatus(i + 1, web3),
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

  getStatus = async (proposalId, web3) => {
    let proposalState = "";
    const tokenAddress = "0xd9FDa03E4dD889484f8556dDb00Ca114e6A1f575"; //contract.contractAddresses["networks"]["137"];

    const tokenContract = new web3.eth.Contract(
      GovernorAlphaContract.abi,
      tokenAddress
    );
    const retries = 5;
    let tryCount = 0;
    let stateUpdated = false;
    while (tryCount < retries && stateUpdated === false) {
      try {
        proposalState = await tokenContract.methods.state(proposalId).call();
        stateUpdated = true;
      } catch (error) {
        console.error("Error getting proposalState: ", error);
        tryCount++;
        proposalState = 8;
      }
    }
    return proposalState;
  };

  componentDidMount = () => {
    // let id = setInterval(() => {
    //   if (this.state.loadedProposals === true) {
    //     clearInterval(id);
    //   }
    //   this.getProposals();
    //   console.log(this.state.loadedProposals);
    // }, 2000);

    setTimeout(
      function () {
        //Start the timer
        this.retryGetProposals();
      }.bind(this),
      1000
    );
  };

  retryGetProposals = async () => {
    let r = 1;
    while (r === 1) {
      r = await this.getProposals();
    }
  };

  getProposals = async () => {
    try {
      console.log("Getting Proposals");
      if (this.props.network === "Matic") {
        console.log("Populating Matic proposal data.");
        return await this.getProposalsFromEvents(this.props.web3);
      } else {
        console.log("Please select the Matic network.");
      }
    } catch (error) {
      console.log("Error in getProposals", error);
      return 1;
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
      return "Expired";
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
              {...this.props}
            />
          );
        }
      });

    return <section className="proposals">{proposals.reverse()}</section>;
  }
}

export default Proposals;
