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
                        <img style={{marginTop:'10px', float:'right'}} width="25px" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUzIDUzIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MyA1MzsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxyZWN0IHg9IjI3IiB5PSIyOCIgc3R5bGU9ImZpbGw6IzQyNEE2MDsiIHdpZHRoPSIyIiBoZWlnaHQ9IjE4Ii8+CjxyZWN0IHg9IjM3LjUiIHk9IjIuODkzIiB0cmFuc2Zvcm09Im1hdHJpeCgwLjcwNzEgMC43MDcxIC0wLjcwNzEgMC43MDcxIDIwLjgyMjMgLTIzLjI2OTYpIiBzdHlsZT0iZmlsbDojNDI0QTYwOyIgd2lkdGg9IjIiIGhlaWdodD0iMjEuMjEzIi8+CjxyZWN0IHg9IjE1IiB5PSIyMS44NTgiIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MSAwLjcwNzEgLTAuNzA3MSAwLjcwNzEgMzAuMTQyMSAtMC43Njk2KSIgc3R5bGU9ImZpbGw6IzQyNEE2MDsiIHdpZHRoPSIyIiBoZWlnaHQ9IjI4LjI4NCIvPgo8cmVjdCB4PSIxMC43MjIiIHk9IjEzLjUiIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MSAwLjcwNzEgLTAuNzA3MSAwLjcwNzEgMTUuNjcxNiAtOC44MzQ1KSIgc3R5bGU9ImZpbGw6IzQyNEE2MDsiIHdpZHRoPSIxNS41NTYiIGhlaWdodD0iMiIvPgo8cmVjdCB4PSIyNi44OTMiIHk9IjMyLjUiIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MSAwLjcwNzEgLTAuNzA3MSAwLjcwNzEgMzQuNjcxNiAtMTYuNzA0NikiIHN0eWxlPSJmaWxsOiM0MjRBNjA7IiB3aWR0aD0iMjEuMjEzIiBoZWlnaHQ9IjIiLz4KPGNpcmNsZSBzdHlsZT0iZmlsbDojNDNCMDVDOyIgY3g9IjQ4IiBjeT0iNSIgcj0iNSIvPgo8Y2lyY2xlIHN0eWxlPSJmaWxsOiM3MzgzQkY7IiBjeD0iMjgiIGN5PSI0OCIgcj0iNSIvPgo8Y2lyY2xlIHN0eWxlPSJmaWxsOiM1N0Q4QUI7IiBjeD0iNSIgY3k9IjQ2IiByPSI1Ii8+CjxjaXJjbGUgc3R5bGU9ImZpbGw6I0Q3NUE0QTsiIGN4PSIxMiIgY3k9IjgiIHI9IjMiLz4KPGNpcmNsZSBzdHlsZT0iZmlsbDojRUJCQTE2OyIgY3g9IjQ0IiBjeT0iNDAiIHI9IjMiLz4KPGNpcmNsZSBzdHlsZT0iZmlsbDojNEI2REFBOyIgY3g9IjI4IiBjeT0iMjQiIHI9IjciLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==" />
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