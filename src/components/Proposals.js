import React, {Component} from 'react';

import Proposal from './Proposal';

import '../layout/components/proposals.sass';

class Proposals extends Component {
  constructor(props) {
    super(props);

    this.state = {
      proposals: []
    }
  }

  componentDidMount = () => {
    this.getProposals();
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
    } else {
      // Default to Ropsten for now
      // TODO: Default to mainnet once it's populated with proposals
      this.props.xhr(
        "https://api.compound.finance/api/v2/governance/proposals?network=ropsten", 
      (res) => {
        const data = JSON.parse(res);
        if(this.state.proposals !== data.proposals) {
          this.setState({proposals: data.proposals});
        }
      });
    }
  }

  render() {
    let proposals = [];

    this.state.proposals.forEach(proposal => {
      if(proposal.title.length > 0) {
        proposals.push(
          <Proposal
            title={proposal.title}
            description={proposal.description} 
            key={proposal.id}
            id={proposal.id}
            end={proposal.states[1].end_time}
            {...this.props}
          />
        );
      } 
    });

    return (
      <section className="proposals">
        {proposals.reverse()}
      </section>
    );
  }
}

export default Proposals;