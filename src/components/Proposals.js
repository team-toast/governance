import React, {Component} from 'react';

import Proposal from './Proposal';

import '../layout/components/proposals.sass';
import contract from '../contracts/GovernorAlpha.json';



class Proposals extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      proposals: []
    }
  }

  genericExamleFunction = async (web3) => {
    let proposalObjs = await this.getAllProposalObjects(web3);
    console.log("Events: ");

    //this.state.proposals
    // title={proposal.title}
    // description={proposal.description} 
    // key={proposal.id}
    // id={proposal.id}
    // end={proposal.states[0].end_time}
    let eventDetail;
    let tmpProposal = [];
    for(let i = 0; i < proposalObjs.length; i++) 
    {
      eventDetail = await this.getProposalEventParameters(web3, parseInt(proposalObjs[i]['startBlock']) - 1, proposalObjs[i]['id']);
      console.log(eventDetail);
      tmpProposal.push(['tmp Title',eventDetail[8], eventDetail[0], eventDetail[0],  eventDetail[7]]);
    };
    console.log("Proposal array: ", tmpProposal);
    this.setState({proposals: tmpProposal});
  }

  getAllProposalObjects = async (web3) => {
    const govAlpha = new web3.eth.Contract(contract.abi, "0xD3b1e8F2bDe0a2DdfC9F6e2EB6e2589e5Ba955b6");
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
  }

  getProposalEventParameters = async (web3, blockNumber, Id) => {
    const govAlpha = new web3.eth.Contract(contract.abi, "0xD3b1e8F2bDe0a2DdfC9F6e2EB6e2589e5Ba955b6");
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
    //this.getProposals();
    setInterval(() => {
      this.getProposals();
    }, 10000);
  }

  getProposals = async () => {
    if(this.props.network === 'Mainnet') {
      this.props.xhr(
        "https://api.compound.finance/api/v2/governance/proposals", 
      (res) => {
        const data = JSON.parse(res);
        if(this.state.proposals !== data.proposals) {
          this.setState({proposals: data.proposals});
        }
      });
    } else if(this.props.network === 'Ropsten') {
      this.props.xhr(
        "https://api.compound.finance/api/v2/governance/proposals?network=ropsten", 
      (res) => {
        const data = JSON.parse(res);
        if(this.state.proposals !== data.proposals) {
          this.setState({proposals: data.proposals});
        }
      });
    } else if (this.props.network === 'Matic') {
      console.log("Populating Matic proposal data.");
      this.genericExamleFunction(this.props.web3);

    } else {
      
      // Default to Ropsten for now
      // TODO: Default to mainnet once it's populated with proposals
      // this.props.xhr(
      //   "https://api.compound.finance/api/v2/governance/proposals?network=ropsten", 
      // (res) => {
      //   const data = JSON.parse(res);
      //   if(this.state.proposals !== data.proposals) {
      //     this.setState({proposals: data.proposals});
      //   }
      // });
    }
  }

  

  render() {
    let proposals = [];

    {this.state.proposals[0] != undefined && this.state.proposals.forEach(proposal => {
      if(proposal[0].length > 0) {
        //console.log("proposal end times:", proposal.states[0].end_time);
        //console.log("proposal end times:", proposal.states[0].end_time);
        proposals.push(
          <Proposal
            title={proposal[0]}
            description={proposal[1]} 
            key={proposal[2]}
            id={proposal[3]}
            end={proposal[7]}
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