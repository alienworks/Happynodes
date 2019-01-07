import React, { Component } from 'react';
import { Router, Route, IndexRoute, BrowserRouter, browserHistory} from 'react-router-dom'
import { Link } from 'react-router-dom'
import './App.css';
import LatestBlockInfo from './components/LatestBlockInfo'
import NetworkStatistics from './components/NetworkStatistics'
import LastBlock from './components/LastBlock'
import BlockTime from './components/BlockTime'
import NodesByRegion from './components/NodesByRegion'
import Validators from './components/Validators'
import BlockList from './components/BlockList'
import TransactionList from './components/TransactionList'
import AssetList from './components/AssetList'
import NEP5AssetList from './components/NEP5AssetList'
import AssetInfo from './components/AssetInfo'
import NEP5AssetInfo from './components/NEP5AssetInfo'
import NodeInfo from './components/NodeInfo'
import BlockInfo from './components/BlockInfo'
import AddressTxs from './components/AddressTxs'
import AddressInfo from './components/AddressInfo'
import AssetRank from './components/AssetRank'
import NEP5AssetRank from './components/NEP5AssetRank'
import TransactionInfo from './components/TransactionInfo'
import NodeEdges from './components/NodeEdges'
import NetworkGraph from './components/NetworkGraph'
import NetworkTable from './components/NetworkTable'
import HistoryTest from './components/History'
import BlockStatistics from './components/BlockStatistics'
import logo from './HappyNodes_Logo.png'
import f27logo from './27-light-red.png'
import UnconfirmedTx from './components/UnconfirmedTx'
import UnconfirmedTxInfo from './components/UnconfirmedTxInfo'
import MainMenu from './components/menu'
import ReactGA from 'react-ga';

ReactGA.initialize(process.env.REACT_APP_GA_KEY, { testMode: process.env.NODE_ENV === 'test' });
class App extends Component {

  componentDidMount  = () => ReactGA.pageview(window.location.pathname + window.location.search);
  componentDidUpdate = () => ReactGA.pageview(window.location.pathname + window.location.search);

  render() {
    return (
      <BrowserRouter>
      <div className="App" id="outer-container">
      <MainMenu/>
        <main id="page-wrap">
        <header className="App-header">
        
          <Link to='/'><img src={logo} className="App-logo" alt="logo" /></Link>
          <LatestBlockInfo/>
          <LastBlock/>
          <BlockTime/>
        </header>
        
        <div className="App-intro">
          <div className="container-fluid">
          <div className="col col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <Route exact path="/" render={({match})=><NodesByRegion/>} />
          <Route path="/:id(\d+)" render={({match})=><NodesByRegion node_id={match.params.id}/>} />
          <Route exact path="/" render={({match})=><NetworkStatistics/>} />
          <Route path="/blocks" render={({match})=><BlockList numentries='30' numpages='1'/>} />
          <Route path="/block/:id(\d+)" render={({match})=><BlockList numentries='30' numpages='1'/>} />
          <Route path="/transactions" render={({match})=><TransactionList numentries='30' numpages='1'/>} />
          <Route path="/transaction/:id" render={({match})=><TransactionList numentries='30' numpages='1'/>} />
          <Route path="/assets" render={({match})=><AssetList/>} />
          <Route path="/nep5assets" render={({match})=><NEP5AssetList/>} />
          <Route path="/asset/:id" render={({match})=><AssetList/>} />
          <Route path="/nep5asset/:id" render={({match})=><NEP5AssetList/>} />
          <Route exact path="/:id(\d+)" render={({match})=><NetworkStatistics/>} />
          <Route exact path="/" render={({match})=><Validators/>} />
          <Route path="/address/:id" render={({match})=><AddressTxs addr={match.params.id}/>} />
          <Route exact path="/:id(\d+)" render={({match})=><Validators/>} />
          <Route exact path="/unconfirmed" render={({match})=><UnconfirmedTx/>} />
          <Route path="/unconfirmedtxinfo/:tx/:connection_id" render={({match})=><UnconfirmedTx/>} />
          </div>



          <div className="col col-lg-9 col-md-9 col-sm-12 col-xs-12">
            <Route path="/block/:id(\d+)" render={({match})=><BlockInfo block_id={match.params.id}/>} />
            <Route path="/transaction/:id" render={({match})=><TransactionInfo tx_id={match.params.id}/>} />
            <Route path="/asset/:id" render={({match})=><AssetInfo asset_id={match.params.id}/>} />
            <Route path="/asset/:id" render={({match})=><AssetRank asset_id={match.params.id}/>} />
            <Route path="/nep5asset/:id" render={({match})=><NEP5AssetInfo asset_id={match.params.id}/>} />
            <Route path="/nep5asset/:id" render={({match})=><NEP5AssetRank asset_id={match.params.id}/>} />
            <Route path="/address/:id" render={({match})=><AddressInfo addr={match.params.id}/>} />
            <Route path="/:id(\d+)" render={({match})=><NodeInfo node_id={match.params.id}/>} />
            <Route path="/:id(\d+)" render={({match})=><NodeEdges node_id={match.params.id}/>} />
            <Route path="/unconfirmedtxinfo/:connection_id/:tx" render={({match})=><UnconfirmedTxInfo  connection_id={match.params.connection_id} tx={match.params.tx}/>} />
            <Route exact path="/" render={({match})=><NetworkGraph/>} />
          </div>
          <Route exact path="/table" render={({match})=><NetworkTable/>} />
          <Route path="/table/filterbyaddress/:addr" render={({match})=><NetworkTable addr_filter={match.params.addr}/>} />
          <Route path="/table/filterbyblockheight/:bh" render={({match})=><NetworkTable blockheight_filter={match.params.bh}/>} />
          <Route path="/table/filterbyversion/:v" render={({match})=><NetworkTable version_filter={match.params.v}/>} />
          
          <Route exact path="/history" render={({match})=><HistoryTest/>} />
          <Route exact path="/blockstatistics" render={({match})=><BlockStatistics/>} />
          </div>
        </div>
        <footer className="App-footer">
        <hr/>
        <div className="footer-credits">
          <img alt="NEO official logo" src="https://neo-cdn.azureedge.net/images/neo_logo.svg"/>
        </div>
        <a href="https://github.com/F27Ventures" rel="noopener noreferrer" target="_blank"><img src={f27logo} className="Footer-app-logo" alt="logo" /></a>
            </footer>
      </main></div>
      </BrowserRouter>
    );
  }
}

export default App;
