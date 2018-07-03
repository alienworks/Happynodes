<p align="center"><img src="https://github.com/neo-ngd/Happynodes/blob/master/neo-interface/src/HappyNodes_Logo.png" width=25% /></p>

> Detailed explanation on how the NEO Blockchain network currently works

# Introduction

The NEO Blockchain, like other Blockchains, uses Distributed Ledger Technology (DLT) to keep records of transactions (grouped into blocks) on multiple computers around the world.
The computers (called Nodes) hold the blockchain. In some blockchains, the Nodes can vary in how much they hold - some hold the entire blockchain (Full Node), others only hold the summary information (Light Node).

Having these Nodes distributed around the world and run independently provides security and resiliency to the network, which provides its intrinsic value.

The NEO Blockchain makes a further distinction, which is that only a select number of Full Nodes can be Consensus Nodes (called Bookkeepers).

These Consensus Nodes are responsible for voting on which transactions make it into each block using NEO's dBFT consensus protocol. The dBFT consensus protocol ensures that the network cannot be compromised as long as an attacker does not gain control of 2/3 of the consensus nodes.

At the moment, there is no economic incentive for Consensus Nodes (they earn no GAS or NEO or otherwise), unlike Mining in Bitcoin/Ethereum. Being a Consensus Node just involves cost (unless you plan to use it to control the block finalization process).

As a result, the consensus nodes are all operated by the NEO core team themselves. Whilst this is efficient and secure, it is not a long term option as it is not decentralised.

NEO 3.0 will provide an incentive structure that should offset the cost of running nodes and allow for more separately run nodes and therefore more security.

# Decentralisation 2018

Having identified the problem and the goal, the NEO Council have set about focusing on decentralising the NEO Network in 2018.

The key steps to achieve this are as follows:

* Improve the Consensus protocol to take into account R&D improvements in the space
* Change the Economic Model to incentivise Full Nodes to become Consesus Nodes (other than the malicious opportunity to control the network)
* Increase the number of stable Full Nodes to provide a large Candidate Pool
* Decide and run an election protocol to vote in new Consensus Nodes and update this periodically

# NEO Nodes

Currently, most NEO Nodes (and the ones you see in HappyNodes) have two possible modes:

* P2P - These nodes connect to other nodes to broadcast information about transactions and blocks that they have seen. Only Consensus Nodes can discuss pending blocks, but once a block has been finalized, it is then communicated out through P2P connections.
* JSON-RPC - this is an optional mode that allows services (could be nodes or could be anyone) to make JSON-RPC requests (POST requests) and ask information such as the Blockheight, or information about an Address or Transaction

Many nodes only run P2P, that is the default setting for the C# and python implementations.

There is also a further mode which is Consensus, but currently this is a fixed set of Nodes and not available to everyone else. As the Decentralisation project progresses, this will be a key status.

It is also possible that a node is running JSON-RPC but not P2P, but since the Node isn't using P2P, it cannot receive new blocks so it is likely to be very out-of-date with its Blockchain.

## Network Health

In ranked order, this is what will make the network successful:

* Lots of Consensus Nodes = Security and Resiliency knowing that it is hard for anyone to control the Block finalization process
* Lots of P2P Nodes = Lots of places storing the full blockchain
* Lots of JSON-RPC Nodes = Lots of places to get information on the blockchain, reducing likelihood of DDOS attacks

## Reading Material

* CoZ's December 2017 Update - https://medium.com/proof-of-working/decentralization-from-coopetition-b10d7ce3b9d
