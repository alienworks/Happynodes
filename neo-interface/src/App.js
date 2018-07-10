import React, { Component } from 'react';

import { Route } from 'react-router-dom';
import { Link } from 'react-router-dom'
import './App.css';
import BestBlock from './components/BestBlock'
import LastBlock from './components/LastBlock'
import BlockTime from './components/BlockTime'
import NodesByRegion from './components/NodesByRegion'
import NodeInfo from './components/NodeInfo'
import NodeEdges from './components/NodeEdges'
import NetworkGraph from './components/NetworkGraph'
import NetworkTable from './components/NetworkTable'
import logo from './HappyNodes_Logo.png'
import f27logo from './27-light-red.png'
import UnconfirmedTx from './components/UnconfirmedTx'
import createHistory from 'history/createBrowserHistory'
import ReactGA from 'react-ga';

ReactGA.initialize(process.env.REACT_APP_GA_KEY);
class App extends Component {

  componentDidMount  = () => ReactGA.pageview(window.location.pathname + window.location.search);
  componentDidUpdate = () => ReactGA.pageview(window.location.pathname + window.location.search);

  render() {
    return (
      <div className="App">
        <header className="App-header">
        <Link to='/'><img src={logo} className="App-logo" alt="logo" /></Link>
          
           <BestBlock/>
            <LastBlock/>
            <BlockTime/>
        </header>

        <div className="App-intro">
          <div className="container-fluid">
          <Route exact path="/" render={({match})=><NodesByRegion/>} />
          <Route path="/:id(\d+)" render={({match})=><NodesByRegion node_id={match.params.id}/>} />
          <div className="col col-lg-6 col-md-6 col-sm-12 col-xs-12">
            <Route path="/:id(\d+)" render={({match})=><NodeInfo node_id={match.params.id}/>} />
            <Route path="/:id(\d+)" render={({match})=><NodeEdges node_id={match.params.id}/>} />
            <Route exact path="/" render={({match})=><NetworkGraph/>} />
            
          </div>
          <Route exact path="/table" render={({match})=><NetworkTable/>} />
          <Route exact path="/" render={()=><UnconfirmedTx/>} />
          <Route path="/:id(\d+)" render={()=><UnconfirmedTx/>} />
          </div>
        </div>
        <footer className="App-footer">
        <hr/>
        <div className="footer-credits">
          <img alt="NEO official logo" src="https://neo.org/images/neo_logo.svg"/>
        </div>
        <a href="https://github.com/F27Ventures" rel="noopener noreferrer" target="_blank"><img src={f27logo} className="Footer-app-logo" alt="logo" /></a>
            </footer>
      </div>
    );
  }
}

export default App;
