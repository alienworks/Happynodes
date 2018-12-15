import React, { Component } from 'react'
import { connect } from 'react-refetch'
import { BrowserRouter, Link } from 'react-router-dom'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'
import config from './config'


class NodesByRegion extends Component {
    static defaultProps = {
        node_id: '-1'
    }

    render() {
        const { nodesbyregion, node_id } = this.props;

        if (nodesbyregion.pending) {
            return (

                    <div className="jumbotron">
                        <h2>Loading...</h2>
                    </div>
            )
        } else if (nodesbyregion.rejected) {
            return (

                    <div>
                        error
                </div>
            )
        } else if (nodesbyregion.fulfilled) {

            const online = nodesbyregion.value['online'];
            const offline = nodesbyregion.value['offline'];
            const online_asia = online['asia'];
            const online_europe = online['europe'];
            const online_americas = online['americas'];
            const offline_asia = offline['asia'];
            const offline_europe = offline['europe'];
            const offline_americas = offline['americas'];

            function LinkWithTooltip({ id, health, children, href, tooltip }) {
                const aStyle = {
                    'backgroundColor': 'hsl(' + health + ',100%,50%)'
                }
                const bStyle = {
                    'backgroundColor': 'hsl(' + health + ',100%,50%)',
                    'borderStyle': 'solid',
                    'borderColor': 'rgb(100, 100, 100)',
                }
                const nodeStyle = node_id === id ? bStyle : aStyle;


                return (
                    <OverlayTrigger
                        overlay={<Tooltip id={id}>{tooltip}</Tooltip>}
                        placement="top"
                        delayShow={100}
                        delayHide={150}
                    >

                        <Link className="node-box" style={nodeStyle} to={{ pathname: './' + id }}><div ></div></Link>
                    </OverlayTrigger>
                );
            }

            return (

                    <div className="jumbotron nodes">
                        <h2>Nodes</h2>
                        <h3>Online ({online_asia.length + online_europe.length + online_americas.length})</h3> <hr style={{
                            'borderColor': '#78cadd', 'borderWidth': '3px'
                        }} />
                        <h4>Asia ({online_asia.length})</h4>
                        <div className="node-boxes">
                            {online_asia.map((item, i) =>

                                <LinkWithTooltip key={i} tooltip={item.address} href="#" health={item.health_score} id={item.id}>
                                    {item.id}
                                </LinkWithTooltip>
                            )
                            }
                        </div>
                        <h4>Europe ({online_europe.length})</h4>
                        <div className="node-boxes">
                            {online_europe.map((item, i) =>

                                <LinkWithTooltip key={i} tooltip={item.address} href="#" health={item.health_score} id={item.id}>
                                    {item.id}
                                </LinkWithTooltip>)
                            }
                        </div>
                        <h4>Americas ({online_americas.length})</h4>
                        <div className="node-boxes">
                            {online_americas.map((item, i) =>
                                <LinkWithTooltip key={i} tooltip={item.address} href="#" health={item.health_score} id={item.id}>
                                    {item.id}
                                </LinkWithTooltip>)
                            }
                        </div>
                        <br />
                        <h3 style={{ clear: 'left', 'paddingTop': '2rem' }}>Offline ({offline_asia.length + offline_europe.length + offline_americas.length})</h3> <hr style={{
                            'borderColor': '#78cadd', 'borderWidth': '3px'
                        }} />
                        <h4>Asia ({offline_asia.length})</h4>
                        <div className="node-boxes">



                            {offline_asia.map((item, i) =>

                                <LinkWithTooltip key={i} tooltip={item.address} href="#" health={item.health_score} id={item.id}>
                                    {item.id}
                                </LinkWithTooltip>
                            )
                            }
                        </div>
                        <h4>Europe ({offline_europe.length})</h4>
                        <div className="node-boxes">
                            {offline_europe.map((item, i) =>
                                <LinkWithTooltip key={i} tooltip={item.address} href="#" health={item.health_score} id={item.id}>
                                    {item.id}
                                </LinkWithTooltip>)
                            }
                        </div>
                        <h4>Americas ({offline_americas.length})</h4>
                        <div className="node-boxes">
                            {offline_americas.map((item, i) =>
                                <LinkWithTooltip key={i} tooltip={item.address} href="#" health={item.health_score} id={item.id}>
                                    {item.id}
                                </LinkWithTooltip>)
                            }
                        </div>
                    </div>
            )
        }
    }
}


export default connect((props) => ({
    nodesbyregion: {
        url: config.api_url.concat(`/nodes`),
        refreshInterval: 3000
    }

}))(NodesByRegion)