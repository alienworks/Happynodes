
import React, { Component } from 'react'
import { push as Menu } from 'react-burger-menu'

class MainMenu extends Component {
    render() {

        return (
            <Menu pageWrapId={"page-wrap"} outerContainerId={"outer-container"}>
                <a id="home" className="menu-item" href="/"><i className="fas fa-home"></i> Home</a>
                <a id="about" className="menu-item" href="/table"><i className="fas fa-th-large"></i> Table View</a>
                <a id="blocks" className="menu-item" href="/blocks"><i className="fas fa-square"></i> Latest Blocks</a>
                <a id="transactions" className="menu-item" href="/transactions"><i className="fas fa-credit-card"></i> Latest Transactions</a>
                <a id="assets" className="menu-item" href="/assets"><i className="fas fa-money-bill"></i> All Assets</a>
                <a id="assets" className="menu-item" href="/nep5assets"><i className="fas fa-money-bill"></i> All NEP-5 Assets</a>
                <a id="blockhistoric" className="menu-item" href="/blockstatistics"><i className="fas fa-chart-bar"></i> Block Statistics</a>
                <a id="historic" className="menu-item" href="/history"><i className="fas fa-chart-bar"></i> Historic Graphs</a>
                <a id="unconfirmed" className="menu-item" href="/unconfirmed"><i className="far fa-clock"></i> Unconfirmed Transactions</a>
                <a id="github" className="menu-item" href="https://github.com/neo-ngd/Happynodes"><i className="fab fa-github"></i> Happynodes Github</a>
            </Menu>
        );
    }
}

export default MainMenu;

