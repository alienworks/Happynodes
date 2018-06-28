<p align="center"><img src="https://github.com/neo-ngd/Happynodes/blob/master/neo-interface/src/HappyNodes_Logo.png" width=25% /></p>

> Aspirational six-month roadmap covering July-December 2018 development

# Roadmap

## Introductory Remarks

The goal of Happynodes is to make a service that is useful to the NEO community. 
Fundamentally, we are different to the lightweight City of Zion Monitor because we have a database to store historical data.
Having access to history gives us the opportunity to take the service in many directions.

We are very open to adjusting or completely re-writing this roadmap based on the feedback of the NEO community, so please get in touch by raising an issue or talking to us on discord.

## Release Format

We aim to follow the [semver](https://semver.org/) Semantic Versioning convention. 
The initial set of commits pre, during and post-Hackathon were all 0.y.z releases.

Given a version number MAJOR.MINOR.PATCH, increment the:

* MAJOR version when you make incompatible API changes,
* MINOR version when you add functionality in a backwards-compatible manner, and
* PATCH version when you make backwards-compatible bug fixes.

## 1.0.0 Codename FLASH

> Summary: Lightning speed front-end and API performance. Re-architect back-end API so it no longer talks directly to database but instead has a Redis in-memory data store in the middle.
This protects the database from being hit with too many requests at one time.

## 1.1.0 Codename SMARTRANDOM

> Summary: Adds a reverse proxy for development community to use to make JSON-RPC requests load-balanced across the NEO blockchain network. 
Uses HappyNodes Health score to weight the nodes during random selection.

## 1.2.0 Codename TRENDSETTER

> Summary: Provide api for historic information on network state allowing users to track the evolution of the NEO network over time (since we start recording data).

## 1.3.0 Codename HAPPYCONSENSUS

> Summary: Provide Consensus monitoring in the API and in front-end as NGD/CoZ roll-out decentralisation of the consensus book-keeping nodes

## 1.4.0 Codename ROSETTASTONE

> Summary: Continue NEO's global mission by translating the front-end as well as the documentation. 
We will support major languages which will further support the development of the global NEO Community.

## 1.5.0 Codename CANDY

> Summary: Knockout Historic visualisation to be best-in-class for the blockchain universe and show off the progress NEO has made in 2018.

