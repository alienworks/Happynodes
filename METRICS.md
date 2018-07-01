<p align="center"><img src="https://github.com/neo-ngd/Happynodes/blob/master/neo-interface/src/HappyNodes_Logo.png" width=25% /></p>

> An introduction to the metrics that we can capture and expose through neo-collector

A metric is simply a "measurement". As of V0.9 (and currently in scope for 1.0), we are collecting a set of metrics that were defined for the Hackathon competition.

# Notes:

- Frequency: these are all currently computed with 10 sec gap between them (on top of the execution delay so roughly 15-20 seconds gap)
- Type: Most of these are captured using JSON-RPC calls so if a node is P2P only, we don't have an easy way of getting that information (as yet).
- REST: CoZ also supports REST for some auxiliary services (not defined in NEO specification) that also provide information, for example, neo-scan.

# Metrics
- **Server-side latency**: the ping latency between our server (running in Google Cloud US) and the nodes. 
- **Blockheight timestamp** : we record the last known blockheight for a particular node the last time we checked. 
- **Online status**: check if a node can be connected to for JSON-RPC
- **Version**: get the current version used to run NEO blockchain. The implementation of this varies although most common are the NEO-CLI variants (run by NEO) and neo-python variants (part of City of Zion)
- **Connection Counts**: get the number of connections a node has (based on JSON-RPC)
- **Mempool Size**: get the number of unconfirmed transactions
- **Unconfirmed Transactions**: gets the actual transaction ID's of the unconfirmed transactions for that node
- **RPC HTTPS**: tracks if JSON-RPC available via HTTPS for that node
- **RPC HTTP**: tracks  if JSON-RPC available via HTTP for that node
- **Validated peers**: tracks the peers that we know about (so takes the node's peers and filters to only ones we know
- **Validated peers counts**: tracks the # peers that we know about (so takes the node's peers and filters to only ones we know

From these metrics we can also calculate some derived metrics:

- **Lag**: the difference between a node's blockheight and the best known blockheight
- **Health Score**: an average of 4 normalised metrics to give a more differentiated scaled score
