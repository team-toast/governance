import React, {Component} from 'react';

import Nav from './components/Nav';
import Header from './components/Header';

import './layout/config/_base.sass';

class App extends Component {
  render() {
    return (
      <div className="app">
        <Nav />
        <Header />
      </div>
    );
  }
}

export default App;
