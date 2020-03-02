import React, {Component} from 'react';

import Nav from './components/Nav';
import Header from './components/Header';
import Proposals from './components/Proposals';

import './layout/config/_base.sass';

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      openCheck: true,
      closedCheck: false
    }
  }

  render() {
    return (
      <div className="app">
        <Nav />
        <Header {...this.state} />
        <Proposals {...this.state} />
      </div>
    );
  }
}

export default App;
