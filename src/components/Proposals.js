import React, {Component} from 'react';

import Proposal from './Proposal';

import '../layout/components/proposals.sass';
import contract from '../contracts/GovernorAlpha.json';



class Proposals extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      proposals: [],
      loadedProposals: false
    }
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
        tmpProposals.push(['tmp Title',eventDetail[8], eventDetail[0], eventDetail[0],  eventDetail[7]]);
      };
      console.log("Proposal array: ", tmpProposals);
      this.setState({proposals: tmpProposals});
    } catch (error) {
      console.error("Error in getProposalsFromEvents", error);
    }
    
  }

  getAllProposalObjects = async (web3) => {
    try {
      const govAlpha = new web3.eth.Contract(contract.abi, "0x0d573c4b5DBb1633FE3ca722510898Fd5a0D49A9");
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
    const govAlpha = new web3.eth.Contract(contract.abi, "0x0d573c4b5DBb1633FE3ca722510898Fd5a0D49A9");
    let found = await govAlpha.getPastEvents(0xda95691a, // method id
          { 
            filter: {id: Id},
            fromBlock: blockNumber-10, toBlock: blockNumber });
    let rawData = found[0]['raw']['data'];
    //console.log(found[0]['raw']['data']);
    let decoded = web3.eth.abi.decodeParameters(['uint256', 'address', 'address[]', 'uint256[]', 'string[]', 'bytes[]', 'uint256', 'uint256', 'string'], rawData);

    return decoded
  }



  componentDidMount = () => {
    setInterval(() => {
        this.getProposals();
    }, 3000);
    //setTimeout(this.getProposals, 1000);
  }

  getProposals = async () => {
    try {
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
        //console.log("proposal end times:", proposal.states[0].end_time);
        //console.log("proposal end times:", proposal.states[0].end_time);
        proposals.push(
          <Proposal
            title={proposal[0]}
            description={proposal[1]} 
            key={proposal[2]}
            id={proposal[3]}
            end={proposal[4]}
            //end={proposal.states[0].end_time} // switching from state[1] to state[0] on mainnet avoids crash
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