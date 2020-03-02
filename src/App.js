import React, {Component} from 'react';

import Nav from './components/Nav';
import Header from './components/Header';
import Proposals from './components/Proposals';

import './layout/config/_base.sass';

class App extends Component {
  render() {
    return (
      <div className="app">
        <Nav />
        <Header 
          {...this.state}
        />
        <Proposals {...this.state} />
      </div>
    );
  }
}

export default App;
