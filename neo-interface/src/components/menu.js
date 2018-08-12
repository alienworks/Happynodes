
import React, { Component } from 'react'
import { push as Menu } from 'react-burger-menu'

class MainMenu extends Component {
    render() {
        
        return (
            <Menu pageWrapId={ "page-wrap" } outerContainerId={ "outer-container" }>
            <a id="home" className="menu-item" href="/"><i className="fas fa-home"></i> Home</a>
            <a id="about" className="menu-item" href="/table"><i className="fas fa-th-large"></i> Table View</a>
            <a id="historic" className="menu-item" href="/history"><i className="fas fa-chart-bar"></i> Historic Graphs</a>
            <a id="unconfirmed" className="menu-item" href="/unconfirmed"><i className="far fa-clock"></i> Unconfirmed Transactions</a>
            <a id="github" className="menu-item" href="https://github.com/neo-ngd/Happynodes"><i className="fab fa-github"></i> Happynodes Github</a>
          </Menu>
        );
    }
}
  
export default MainMenu;

