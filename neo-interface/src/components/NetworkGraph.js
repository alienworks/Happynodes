import React, { Component } from 'react'
import { connect } from 'react-refetch'
import Graph from 'react-graph-vis'
import config from './config'

class NetworkGraph extends Component {
    render() {
        const { nodeedges, nodeslist } = this.props;
        if (nodeedges.pending || nodeslist.pending) {
            return (

                <div className="jumbotron">
                    <h2>Loading...</h2>
                </div>
            )
        } else if (nodeedges.rejected || nodeslist.rejected) {
            return (

                <div>
                    error
                </div>
            )
        } else if (nodeedges.fulfilled || nodeslist.fulfilled) {

            const edges_data = nodeedges.value;
            const nodeslist_data = nodeslist.value;


            const d_edges = edges_data.map((item, i) => { return { "from": item.source_address_id, "to": item.validated_peers_address_id } });
            let edgeCount = {}

            for (let i = 0; i < edges_data.length; i++) {
                edgeCount[edges_data[i]['source_address_id']] = edges_data[i]['source_address_id'] in edgeCount ? 1 + edgeCount[edges_data[i]['source_address_id']] : 1
            }

            const d_nodes = nodeslist_data.map((item, i) => { return { "id": item.id, label: item.address, size: 1 + (edgeCount[item.id]) } });

            const data = {
                nodes: d_nodes,
                edges: d_edges
            };

            var options = {
                layout: {
                    hierarchical: false
                },
                edges: {
                    arrows: {
                        to: { enabled: false, scaleFactor: 1, type: 'arrow' },
                        middle: { enabled: false, scaleFactor: 1, type: 'arrow' },
                        from: { enabled: false, scaleFactor: 1, type: 'arrow' }
                    },
                    "arrowStrikethrough": false,
                    "color": {
                        "inherit": false
                    }
                },
                nodes: {
                    shape: 'hexagon',
                    color: '#58bf00',
                    "shadow": {
                        "enabled": true
                    }
                },
                physics: {
                    stabilization: false,
                    maxVelocity: 30,
                    solver: 'forceAtlas2Based',
                }
            };

            var events = {
                select: function (event) {
                    var { nodes, edges } = event;
                    console.log(nodes, edges);
                    if (nodes.length === 1) {
                        window.location = "./" + nodes[0];
                    }

                }
            }


            return (

                <div className="jumbotron nodes padgraph" style={{ 'width': '100%', 'height': '900px' }}>


                    <img alt="" style={{marginTop:'10px', float:'right'}} width="25px" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMi4wMDEgNTEyLjAwMSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTEyLjAwMSA1MTIuMDAxOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPHBhdGggc3R5bGU9ImZpbGw6IzQ3NUQ2RDsiIGQ9Ik0zNjUuMjc1LDIyLjEzNWg1MS4yNDdjMTIuNzAyLDAsMjQuMTksNy41NDYsMjkuMjM1LDE5LjIwNGwzLjI3NSw3LjU2OWgxNS40NjYgIEM0OTAuNzMzLDQ4LjkwOCw1MTIsNzAuMTc1LDUxMiw5Ni40MXYxNzQuNjgzYzAsMTguNjM1LTE1LjEwNywzMy43NDItMzMuNzQyLDMzLjc0MkgzMDcuODI2Yy0xOC42MzUsMC0zMy43NDItMTUuMTA3LTMzLjc0Mi0zMy43NDIgIFYxMTMuMzI3QzI3NC4wODQsNjIuOTYzLDMxNC45MTEsMjIuMTM1LDM2NS4yNzUsMjIuMTM1eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojMkMzRjRGOyIgZD0iTTQ2NC40OTgsNDguOTA4aC0xNS40NjVsLTMuMjc1LTcuNTY5Yy01LjA0NC0xMS42NTgtMTYuNTMyLTE5LjIwNC0yOS4yMzUtMTkuMjA0aC0yNi41NDQgIGMxMi43MDIsMCwyNC4xOSw3LjU0NiwyOS4yMzUsMTkuMjA0bDMuMjc1LDcuNTY5aDE1LjQ2NmMyNi4yMzUsMCw0Ny41MDIsMjEuMjY3LDQ3LjUwMiw0Ny41MDJ2MTc0LjY4MyAgYzAsMTguNjM1LTE1LjEwNywzMy43NDItMzMuNzQyLDMzLjc0MmgyNi41NDRjMTguNjM1LDAsMzMuNzQyLTE1LjEwNywzMy43NDItMzMuNzQyVjk2LjQxMSAgQzUxMiw3MC4xNzYsNDkwLjczMyw0OC45MDgsNDY0LjQ5OCw0OC45MDh6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNGOURDNkE7IiBkPSJNMjA1Ljg0LDQ5LjIyMWwtOTcuMTktMjMuMTE5Yy0xMC4zNi0yLjQ2NS0yMS4yNTgsMC42MjEtMjguNzg4LDguMTUxTDUyLjIyNSw2MS44OUg0MC41MTIgIGMtMTYuOTQxLDAtMzAuNjc0LDEzLjczMy0zMC42NzQsMzAuNjc0YzAsMC0xLjU0NywzNy42MzQsMCw1MC4wNTFjMS44MzgsMTQuNzUzLDE0LjU5Miw1Ny42NDksMTQuNTkyLDU3LjY0OWgyMDcuMjg5ICBsMzguODQ0LTE1My43MjZjMS45OTEtNy44ODYtNy4xNjgtMTMuNzk0LTEzLjUzMi04LjcyOWwwLDBDMjQyLjYyNiw0OS4yNzMsMjIzLjc1MSw1My40ODEsMjA1Ljg0LDQ5LjIyMXoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0U1QUM1MTsiIGQ9Ik0yNTcuMDMxLDM3LjgwOEwyNTcuMDMxLDM3LjgwOGMtNC4wNDQsMy4yMTktOC40NDksNS44NDMtMTMuMDc3LDcuODkxICBjLTAuMDQzLDAuMjc5LTAuMDcsMC41NTQtMC4xNDIsMC44MzhsLTM4Ljg0NCwxNTMuNzI2aDI2Ljc1MWwzOC44NDQtMTUzLjcyNkMyNzIuNTUzLDM4LjY1MiwyNjMuMzk0LDMyLjc0MywyNTcuMDMxLDM3LjgwOHoiLz4KPHBhdGggc3R5bGU9ImZpbGw6IzJCQjRGMzsiIGQ9Ik01MDUuNCwzODYuNDUxdjEwMy40MUgzMTcuOHYtOTYuNTlIMzkuMDJ2LTYyLjA3aDQxMS4xM0M0ODAuNjYsMzMxLjIwMSw1MDUuNCwzNTUuOTMsNTA1LjQsMzg2LjQ1MXogICIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiMxNjg3QzQ7IiBkPSJNNDUwLjE0OCwzMzEuMTk5aC0yMy42NTFjMzAuNTE0LDAsNTUuMjUsMjQuNzM2LDU1LjI1LDU1LjI1djEwMy40MTZoMjMuNjUxVjM4Ni40NDggICBDNTA1LjM5OCwzNTUuOTM1LDQ4MC42NjIsMzMxLjE5OSw0NTAuMTQ4LDMzMS4xOTl6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojMTY4N0M0OyIgZD0iTTI3MC44MjksMzkzLjI3M3YtNi44MjRjMC0zMC41MTMtMjQuNzM0LTU1LjI0OC01NS4yNDctNTUuMjVIMTAxLjM2NCAgIGMtMzAuNTEyLDAuMDAxLTU1LjI0NywyNC43MzctNTUuMjQ3LDU1LjI1djYuODI0SDI3MC44Mjl6Ii8+CjwvZz4KPHBhdGggc3R5bGU9ImZpbGw6I0YyQTA3NzsiIGQ9Ik0zNTkuNzU0LDI3NS42ODV2NjcuMDk4YzAsMTguMzg1LDMzLjI4OCwzNi45MzYsMzMuMjg4LDM2LjkzNnMzMy4yODgtMTguNTUyLDMzLjI4OC0zNi45MzZ2LTY3LjA5OCAgSDM1OS43NTR6Ii8+CjxwYXRoIHN0eWxlPSJmaWxsOiNGRkNDQUE7IiBkPSJNNTA5LjM1NSwxOTUuNTY2djkuODAxYzAsMTEuNDQyLTkuMjY1LDIwLjcyLTIwLjcwOCwyMC43MmgtNy4wMjggIGMtMi44MDgsNTQuMDUxLTUyLjk0LDkxLjU4OS0xMDIuMTI4LDgzLjAyNmgtMC4wMTJjLTQxLjA1MS02LjI5OS03Mi44MjQtNDAuNzQ3LTc1LjAxMy04My4wMjZoLTcuMDI4ICBjLTExLjQ0MiwwLTIwLjcyLTkuMjc4LTIwLjcyLTIwLjcydi05LjgwMWMwLTExLjQ0Miw5LjI3OC0yMC43MiwyMC43Mi0yMC43Mmg2Ljg5NFYxMjkuODhjMC0xLjIwNCwwLjAyNC0yLjM5NSwwLjA4NS0zLjU3NSAgYzEyLjE2LDIuMzQ3LDI0LjcyLDMuNTYzLDM3LjU2MSwzLjU2M2MzOS4xMywwLDc1LjYwOC0xMS4zMzMsMTA2LjMzNi0zMC45MWM2LjczNi00LjI4LDEzLjIwNS04Ljk2MiwxOS4zNTgtMTQuMDIgIGM4LjY2MywxMi4yNDMsMTQuMDY4LDI4LjE0MywxNC4wNjgsNDQuOTQydjQ0Ljk2Nmg2LjkwN0M1MDAuMDksMTc0Ljg0Niw1MDkuMzU1LDE4NC4xMjQsNTA5LjM1NSwxOTUuNTY2eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRjJBMDc3OyIgZD0iTTQ4OC42NDgsMTc0Ljg0NmgtNi45MDd2LTE4LjM1N2gtMC4wMDljLTAuMDA0LTMwLjQ3OC0wLjAwNy0yOC4wOS0wLjAxNS0yOC41MTggIGMtMC4zOTUtMTYuMTYzLTUuNzU0LTMxLjMxOC0xNC4wNDQtNDMuMDMzYy02LjE1Myw1LjA1OC0xMi42MjIsOS43NC0xOS4zNTgsMTQuMDJjNC4wNDksOS40OTcsNi4yOTksMTkuOTQyLDYuMjk5LDMwLjkyMnY0NC45NjYgIGwtMC4xMzQsNTEuMjQxYy0xLjIxNiwyMy40MDctMTEuNDkxLDQ0LjQzMS0yNy40MDgsNTkuNTk0Yy0xMi44MTYsMTIuMjItMjkuMjgsMjAuNjExLTQ3LjU4LDIzLjQzMiAgYzQ0Ljg4Myw3LjgxNCw5MC41NDMtMjIuNzU5LDEwMC4zMjgtNjkuMjMzbDAsMGMwLjAwMS0wLjAwMywwLjAwMS0wLjAwNiwwLjAwMi0wLjAwOWMwLjQ2NS0yLjIwOSwwLjg1MS00LjQ1MiwxLjE1LTYuNzMgIGMwLjAwOS0wLjA2OSwwLjAxNi0wLjEzOSwwLjAyNS0wLjIwOGMwLjEyNC0wLjk2NSwwLjIzMS0xLjkzNywwLjMyNS0yLjkxM2MwLjAyMy0wLjI0NSwwLjA0Ny0wLjQ4OSwwLjA2OS0wLjczNSAgYzAuMDkzLTEuMDYsMC4xNzQtMi4xMjQsMC4yMjktMy4xOThoMC4xMjFoNi45MDdjMTEuNDQyLDAsMjAuNzA4LTkuMjc4LDIwLjcwOC0yMC43MnYtOS44MDEgIEM1MDkuMzU1LDE4NC4xMjQsNTAwLjA5LDE3NC44NDYsNDg4LjY0OCwxNzQuODQ2eiIvPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM0NzVENkQ7IiBkPSJNMzkzLjA0MiwyNTguNTc5Yy0xMS41ODUsMC0yMi40OS00LjUxNC0zMC43MDctMTIuNzA5Yy00LjE1NS00LjE1NS03LjM2MS04Ljk5My05LjUzNi0xNC4zODUgICBjLTEuNTUtMy44NDEsMC4zMDgtOC4yMTEsNC4xNDktOS43NjFjMy44NDEtMS41NSw4LjIxMiwwLjMwOCw5Ljc2MSw0LjE1YzEuNDE3LDMuNTEyLDMuNTEyLDYuNjY5LDYuMjI2LDkuMzg0ICAgYzUuMzc4LDUuMzY0LDEyLjUyMSw4LjMyMiwyMC4xMDcsOC4zMjJjMTEuNjM0LDAsMjEuOTcyLTYuOTU1LDI2LjMzOC0xNy43MTljMS41NTgtMy44MzgsNS45MjgtNS42ODgsOS43Ny00LjEzMSAgIGMzLjgzOCwxLjU1Nyw1LjY4OCw1LjkzMSw0LjEzMSw5Ljc2OUM0MjYuNjA3LDI0Ny45NDksNDEwLjgxMywyNTguNTc5LDM5My4wNDIsMjU4LjU3OXoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM0NzVENkQ7IiBkPSJNMzQ4LjYzNywxODguMDk1Yy00LjE0MywwLTcuNS0zLjM1OC03LjUtNy41di00LjI4NWMwLTQuMTQyLDMuMzU3LTcuNSw3LjUtNy41czcuNSwzLjM1OCw3LjUsNy41ICAgdjQuMjg1QzM1Ni4xMzcsMTg0LjczNywzNTIuNzc5LDE4OC4wOTUsMzQ4LjYzNywxODguMDk1eiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6IzQ3NUQ2RDsiIGQ9Ik00MzcuNDQ3LDE4OC4wOTVjLTQuMTQzLDAtNy41LTMuMzU4LTcuNS03LjV2LTQuMjg1YzAtNC4xNDIsMy4zNTctNy41LDcuNS03LjVzNy41LDMuMzU4LDcuNSw3LjUgICB2NC4yODVDNDQ0Ljk0NywxODQuNzM3LDQ0MS41OSwxODguMDk1LDQzNy40NDcsMTg4LjA5NXoiLz4KPC9nPgo8cGF0aCBzdHlsZT0iZmlsbDojRkY1QTU5OyIgZD0iTTI0MC40MywzODYuNDUxdjEwMy40MUgxNS43MnYtMTAzLjQxYzAtMzAuNTIsMjQuNzMtNTUuMjUsNTUuMjUtNTUuMjVoMTE0LjIxICBDMjE1LjY5LDMzMS4yMDEsMjQwLjQzLDM1NS45MywyNDAuNDMsMzg2LjQ1MXoiLz4KPHBhdGggc3R5bGU9ImZpbGw6I0NFM0E0QzsiIGQ9Ik0xODUuMTgsMzMxLjE5OWgtMjMuNjUxYzMwLjUxNCwwLDU1LjI1LDI0LjczNiw1NS4yNSw1NS4yNXYxMDMuNDE2aDIzLjY1MVYzODYuNDQ4ICBDMjQwLjQzLDM1NS45MzUsMjE1LjY5NCwzMzEuMTk5LDE4NS4xOCwzMzEuMTk5eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRjJBMDc3OyIgZD0iTTk0Ljc4NiwyNzUuNjg1djY3LjA5OGMwLDE4LjM4NSwxNC45MDQsMzMuMjg4LDMzLjI4OCwzMy4yODhsMCwwICBjMTguMzg1LDAsMzMuMjg4LTE0LjkwNCwzMy4yODgtMzMuMjg4di02Ny4wOThIOTQuNzg2eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRkZDQ0FBOyIgZD0iTTI0NC4zOTgsMTk1LjU2NnY5LjgwMWMwLDExLjQ0Mi05LjI3OCwyMC43Mi0yMC43MiwyMC43MmgtNy4wMjggIGMtMC45MjgsMTcuMTUzLTYuODM4LDMzLjI4Ny0xNS4xODcsNDUuMTczYzAsMC4wMTItMC4wMTIsMC4wMTItMC4wMTIsMC4wMjRjLTE2LjY5MywyNS42NzUtNTEuMDY1LDQzLjI0OS04Ni45MjksMzcuODI4aC0wLjAxMiAgYy00MS4wNTEtNi4yOTktNzIuODI0LTQwLjc0Ny03NS4wMTMtODMuMDI2aC03LjAyOGMtMTEuNDQyLDAtMjAuNzA4LTkuMjc4LTIwLjcwOC0yMC43MnYtOS44MDFjMC0xMS40NDIsOS4yNjYtMjAuNzIsMjAuNzA4LTIwLjcyICBoNi45MDd2LTMyLjYxMmMyMy43OTYtMS42MDUsMzEuNDkzLTguOTAxLDMxLjQ5My0zMi4zNTdjMCwwLDMwLjI3Nyw1My45MjgsMTE4Ljc3NSwzNy44NTNjOC41LTEuNTQ0LDE3LjUzNC0zLjczMywyNy4xNC02LjY3NiAgdjMzLjc5MWg2Ljg5NEMyMzUuMTIsMTc0Ljg0NiwyNDQuMzk4LDE4NC4xMjQsMjQ0LjM5OCwxOTUuNTY2eiIvPgo8cGF0aCBzdHlsZT0iZmlsbDojRjJBMDc3OyIgZD0iTTIyMy42NzgsMTc0Ljg0NmgtNi44OTR2LTYuMTk3di0yNy41OTRjLTkuNjA2LDIuOTQzLTE4LjY0MSw1LjEzMS0yNy4xNCw2LjY3NnYyNy4xMTZsLTAuMTM0LDUxLjI0MSAgYy0xLjIxNiwyMy40MDctMTEuNDkxLDQ0LjQzMS0yNy40MDgsNTkuNTk0Yy0xMi44MTYsMTIuMjItMjkuMjY4LDIwLjYxMS00Ny41OCwyMy40MzJjMzUuODUzLDUuNDE5LDcwLjI5Ny0xMi4yNDgsODYuOTI5LTM3LjgyOCAgYzAtMC4wMTIsMC4wMTItMC4wMTIsMC4wMTItMC4wMjRjNS4zNTctNi44MiwxMS4wODYtMTkuNjM3LDEzLjc1Ni0zMy43MDZoMC4wNDljMC40NzUtMi41NjksMC44NDEtNS4xODEsMS4wOTctNy44MjIgIGMwLjAxLTAuMTA1LDAuMDIzLTAuMjA5LDAuMDMzLTAuMzE1YzAuMTAzLTEuMTA1LDAuMTkxLTIuMjE0LDAuMjUyLTMuMzNoMC4xMzRoNi44OTRjMTEuNDQyLDAsMjAuNzItOS4yNzgsMjAuNzItMjAuNzJ2LTkuODAxICBDMjQ0LjM5OCwxODQuMTI0LDIzNS4xMiwxNzQuODQ2LDIyMy42NzgsMTc0Ljg0NnoiLz4KPGc+Cgk8cGF0aCBzdHlsZT0iZmlsbDojNDc1RDZEOyIgZD0iTTEyOC4wNzQsMjU4LjU3OWMtMTEuNTg2LDAtMjIuNDkxLTQuNTE0LTMwLjcwOC0xMi43MDljLTQuMTUzLTQuMTU0LTcuMzU5LTguOTkxLTkuNTM2LTE0LjM4NCAgIGMtMS41NS0zLjg0MSwwLjMwNy04LjIxMiw0LjE0OC05Ljc2MmMzLjg0MS0xLjU1Myw4LjIxMSwwLjMwOCw5Ljc2Miw0LjE0OGMxLjQxOCwzLjUxMywzLjUxMyw2LjY3MSw2LjIyNyw5LjM4NSAgIGM1LjM3OCw1LjM2NCwxMi41MjEsOC4zMjIsMjAuMTA3LDguMzIyYzExLjYzNCwwLDIxLjk3Mi02Ljk1NSwyNi4zMzgtMTcuNzE5YzEuNTU4LTMuODM4LDUuOTI4LTUuNjg4LDkuNzctNC4xMzEgICBjMy44MzgsMS41NTcsNS42ODgsNS45MzEsNC4xMzEsOS43NjlDMTYxLjY0LDI0Ny45NDksMTQ1Ljg0NSwyNTguNTc5LDEyOC4wNzQsMjU4LjU3OXoiLz4KCTxwYXRoIHN0eWxlPSJmaWxsOiM0NzVENkQ7IiBkPSJNODMuNjY5LDE4OC4wOTVjLTQuMTQzLDAtNy41LTMuMzU4LTcuNS03LjV2LTQuMjg1YzAtNC4xNDIsMy4zNTctNy41LDcuNS03LjVzNy41LDMuMzU4LDcuNSw3LjUgICB2NC4yODVDOTEuMTY5LDE4NC43MzcsODcuODEyLDE4OC4wOTUsODMuNjY5LDE4OC4wOTV6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojNDc1RDZEOyIgZD0iTTE3Mi40NzksMTg4LjA5NWMtNC4xNDMsMC03LjUtMy4zNTgtNy41LTcuNXYtNC4yODVjMC00LjE0MiwzLjM1Ny03LjUsNy41LTcuNXM3LjUsMy4zNTgsNy41LDcuNSAgIHY0LjI4NUMxNzkuOTc5LDE4NC43MzcsMTc2LjYyMiwxODguMDk1LDE3Mi40NzksMTg4LjA5NXoiLz4KPC9nPgo8cGF0aCBzdHlsZT0iZmlsbDojRkZDQ0FBOyIgZD0iTTM4LjA3NSw0MDIuMjQ1SDE5LjI1OUM4LjYyMyw0MDIuMjQ1LDAsMzkzLjYyMiwwLDM4Mi45ODV2LTQyLjAzNSAgYzAtMTAuNjM3LDguNjIzLTE5LjI1OSwxOS4yNTktMTkuMjU5aDE4LjgxNmM3LjgxNCwwLDE0LjE0OSw2LjMzNSwxNC4xNDksMTQuMTQ5djUyLjI1NSAgQzUyLjIyNSwzOTUuOTEsNDUuODksNDAyLjI0NSwzOC4wNzUsNDAyLjI0NXoiLz4KPGc+Cgk8cGF0aCBzdHlsZT0iZmlsbDojQ0UzQTRDOyIgZD0iTTIxMC44Miw0MzAuMzd2NTkuNDloLTE1di01OS40OWMwLTQuMTQsMy4zNi03LjUsNy41LTcuNVMyMTAuODIsNDI2LjIzLDIxMC44Miw0MzAuMzd6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojQ0UzQTRDOyIgZD0iTTYwLjMzLDQzMC4zN3Y1OS40OWgtMTV2LTU5LjQ5YzAtNC4xNCwzLjM2LTcuNSw3LjUtNy41UzYwLjMzLDQyNi4yMyw2MC4zMyw0MzAuMzd6Ii8+CjwvZz4KPHBhdGggc3R5bGU9ImZpbGw6IzE2ODdDNDsiIGQ9Ik00NzUuNzksNDMwLjM3djU5LjQ5aC0xNXYtNTkuNDljMC00LjE0LDMuMzUtNy41LDcuNS03LjVDNDcyLjQzLDQyMi44Nyw0NzUuNzksNDI2LjIzLDQ3NS43OSw0MzAuMzcgIHoiLz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==" />
                    <h2>Direct Peers</h2>
                    <hr style={{
                        'borderColor': '#78cadd', 'borderWidth': '3px'
                    }} />

                    <Graph graph={data} options={options} events={events} />



                </div>
            )
        }
    }
}

export default connect((props) => ({
    nodeedges: { url: config.api_url.concat(`/edges`) },
    nodeslist: { url: config.api_url.concat(`/nodeslist`) }
}))(NetworkGraph)