<p align="center"><img src="https://github.com/neo-ngd/Happynodes/blob/master/neo-interface/src/HappyNodes_Logo.png" width=25% /></p>
<p align="center"> 1<sup>st</sup> Prize Winner of London 2018 NEO Hackathon</p>
<p align="center">>> <a href="https://happynodes.f27.ventures">https://happynodes.f27.ventures</a> <<</p>
<p align="center"><img src="https://img.shields.io/github/release/neo-ngd/Happynodes.svg">
 <img src="https://img.shields.io/badge/status-online-green.svg">
 <img src="https://img.shields.io/github/stars/F27Ventures/Happynodes.svg">
 <img src="https://img.shields.io/github/license/F27Ventures/Happynodes.svg">
  
 <a><img src="https://img.shields.io/discord/461663571219054592.svg?logo=discord" alt="chat on Discord"></a></p>
 
# Overview

Happynodes is a blockchain network monitor and visualisation tool designed for the NEO Smart Economy Blockchain. It is live on https://happynodes.f27.ventures. It is developed and run by F27 with support from NGD. There is also an API under development that powers the front-end but will have useful metrics for the NEO community that are currently not available anywhere else (primarily historic information).

Current Release: [0.9.0](https://github.com/neo-ngd/Happynodes/releases/tag/v0.9.0). You can see our [Milestones](https://github.com/neo-ngd/Happynodes/milestones) for more information on what is in each major release, as well as our [Releases](https://github.com/neo-ngd/Happynodes/releases/latest) log.

<details>
 <summary><strong>Table of Contents</strong> (click to expand)</summary>

* [Roadmap](#roadmap)
* [Component Structure](#component-structure)
* [Production Setup](#production-setup)
* [History](#history)
* [Notes on F27 Ventures](#notes-on-f27-ventures)
* [Licence](#licence)

</details>

## Latest UI

> Last Recording: 30th June 2018

<img src="https://github.com/neo-ngd/Happynodes/blob/master/HappyNodes-1.gif">

## Component Structure

> Current HappyNodes structure

The HappyNodes repo is a split into a number of components we have developed to monitor the state of the network over time:

* *neo-back* API layer, written in Node.js and Express. Live on https://api.happynodes.f27.ventures
* *neo-collector* - backend processing (making JSON-RPC and Ping tests on nodes and updating database), written in Python 3.6+.
* *neo-interface* - front-end responsive web app, written in Node.js, Express and React. Live on https://happynodes.f27.ventures
* *neo-node* - lightweight NEO node to test out P2P connections on nodes, written using Python 3.6+ and neo-python. 


## Production Setup

> Using Google Cloud Platform

Since HappyNodes currently has no revenue stream, it was important to keep the Server costs as lean as possible. However, we wanted to build a resilient and scalable solution so as the developer community grows, the site and API will continue to work without issues.

We expect future versions to contain major revisions to the production setup.

<img src="https://github.com/neo-ngd/Happynodes/blob/master/Happynodes.svg" width=100% />



## Local Deployment Instructions

> TODO

## Roadmap

> July-Dec 2018 Plan

After the Hackathon finished (June 17th 2018), our team decided to continue on developing as we saw the potential value it could bring to the NEO community. We started working on ambitious set of features and grouped it into releases. You can find more on our official [roadmap](https://github.com/neo-ngd/Happynodes/blob/master/ROADMAP.md).

## History

> How Happynodes came to be

NGD (NEO Global Development) decided to sponsor and run the first NEO London Hackathon on 17th June 2018 with the aim of finding a companion network monitor to City of Zion's [neo-mon](https://github.com/CityOfZion/neo-mon) project, [City of Zion | Monitor](http://monitor.cityofzion.io/).

Based on the rules of the Hackathon and from our experiences of City of Zion's monitor, we tried to focus on:

* A user-friendly experience that would welcoming to new and existing developers
* Adding historical information (CoZ's monitor is database-less, so can't monitor evolution over time)
* Providing some innovation not seen in the existing monitor or any other NEO tool

<img src="https://github.com/neo-ngd/Happynodes/blob/master/Happynodes%20Interface%20Screenshot.png" width=50% />


### NGD's London Hackathon 2018

Youtube Video: [NEO London Meetup & Hackathon](https://youtu.be/rhz1F6EB6LE?t=1m3s)

F27 took part of NEO Global Development's first London Hackathon on 17th June 2018. The hackathon was organised by NGD with the goal to help participants LEARN, THINK and CREATE on NEO's Smart Economy platform.

This specific challenge centred around Network State Monitoring.

For us, this was a series of firsts: our first NEO meetup, our first hackathon as Team F27, and the first time we published a live App to an audience from F27.

Since this was a time sensitive hackathon, please excuse our early commits around code quality. We focused on making resilient, fully working functionality which we achieved.

To find out more on the hackathon visit [NEO Blockchain Challenge — London 2018](https://github.com/neo-ngd/Hackathon/blob/master/6.17%20NEO%20Blockchain%20Challenge%20-%20London.md)

Our Innovations:
- New Health Scoring system taking into account 4 metrics to provide differentiation between Online Nodes
- Unconfirmed Transactions explorer - see how many nodes are supporting the as-yet unconfirmed transactions
- Graph explorer to show the connections for the network as well as the direct edges for each Node

## Licence

This project is licensed under the terms of the **MIT** license.

## Notes on F27 Ventures

F27 was started by a group of 27-year olds who wanted to change the world one code commit at a time. We've worked at startups, large corporates and gone freelance. You don't have to be 27 to be part of our journey, you just need to dig what we do.

![F27](https://github.com/F27Ventures/cohorts/blob/master/F27-888x100-2b_02.jpg)
