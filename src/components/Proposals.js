import React, {Component} from 'react';

import Proposal from './Proposal';

import '../layout/components/proposals.sass';
import contract from '../contracts/GovernorAlpha.json';

class Proposals extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      proposals: [],
      loadedProposals: false,
      timeout: 0
    }
  }

  sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  getProposalsFromEvents = async (web3) => {
    try {
      let proposalObjs = await this.getAllProposalObjects(web3);
      console.log("Events: ");

      let eventDetail;
      let tmpProposals = [];
      for(let i = 0; i < proposalObjs.length; i++) 
      {
        eventDetail = await this.getProposalEventParameters(web3, parseInt(proposalObjs[i]['startBlock']) - 1, proposalObjs[i]['id']);
        console.log(eventDetail);
        // Title, description, id (key), id, end_time
        tmpProposals.push(['Proposal ' + parseInt(eventDetail[0]),eventDetail[8], eventDetail[0], eventDetail[0],  eventDetail[7]]);
      };
      console.log("Proposal array: ", tmpProposals);
      this.setState({proposals: tmpProposals});

      if(tmpProposals.length > 0) {
        this.setState({loadedProposals: true});
      }
      
    } catch (error) {
      console.error("Error in getProposalsFromEvents", error);
    }
    
  }

  getAllProposalObjects = async (web3) => {
    try {
      const govAlpha = new web3.eth.Contract(contract.abi, contract['networks']['137']['address']);
      let numOfProposals = await govAlpha.methods.proposalCount().call();

      let proposals = [];
      let tmpProposal;
      for(let i = 0; i < numOfProposals; i++) {
        tmpProposal = await govAlpha.methods.proposals(i+1).call();
        proposals.push(tmpProposal);
      }
        console.log("Proposal Objects: ");
        proposals.forEach(element => {
          console.log(element);
      });
      return proposals;

    } catch (error) {
      console.error("Error in getAllProposalObjects: ", error);
    }
  }

  getProposalEventParameters = async (web3, blockNumber, Id) => {
    const govAlpha = new web3.eth.Contract(contract.abi, contract['networks']['137']['address']);
    let found = await govAlpha.getPastEvents(0xda95691a, // method id
          { 
            filter: {id: Id},
            fromBlock: blockNumber-10, toBlock: blockNumber });
    let rawData = found[0]['raw']['data'];
    let decoded = web3.eth.abi.decodeParameters(['uint256', 'address', 'address[]', 'uint256[]', 'string[]', 'bytes[]', 'uint256', 'uint256', 'string'], rawData);

    return decoded
  }

  componentDidMount = () => {
    let id = setInterval(() => {
        this.getProposals();
        console.log(this.state.loadedProposals);
        if(this.state.loadedProposals == true) {
          clearInterval(id);
        }
    }, 1000);
  }

  getProposals = async () => {
    try {
      console.log("Getting Proposals");
      if (this.props.network === 'Matic') {
        console.log("Populating Matic proposal data.");
        this.getProposalsFromEvents(this.props.web3);

      } else {
        console.log("Please select the Matic network.");
      }
    } catch (error) {
      console.log("Error in getProposals", error);
    }
  
  }

  render() {
    let proposals = [];

    {this.state.proposals[0] !== undefined && this.state.proposals.forEach(proposal => {
      if(proposal[0].length > 0) {
        proposals.push(
          <Proposal
            title={proposal[0]}
            description={proposal[1]} 
            key={proposal[2]}
            id={proposal[3]}
            end={proposal[4]}
            {...this.props}
          />
        );
      } 
    });}

    return (
      <section className="proposals">
        {proposals.reverse()}
      </section>
    );
  }
}

export default Proposals;