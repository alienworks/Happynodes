At the moment, there is no easy way to contact owners of RPC nodes if they do not make themselves known.

However, RPC nodes are used by lots of our community to get information about the blockchain. RPC nodes are great as they help with decentralisation of information and not putting too much pressure on one or two servers.

The downside of this is that currently validation of RPC node data (Blockchain, Storage, Notifications) is not easy to do.

The Happynodes team is working with CoZ and NEO Research on an improvement proposal to make validation easier.

Until then, we are publishing the list of known issues with specific nodes to help the community out.

Please make a Pull Request to update this file as the situation changes.

========================================================================

Known Issues

- Since the dead fork incident in August, quite a lot of RPC nodes are stuck on the dead block (2623809) or the one after it.
A full resync is advised to make sure there are no artifiacts or issues. You can see this on https://happynodes.f27.ventures/table
https://github.com/neo-project/neo-cli/issues/219
- A smaller dead fork issue happened for blockheight 2670510 leading to some nodes stuck on 2670511.
These are: http://52.224.162.48:10332, http://seed7.ngd.network:10332, http://seed3.aphelion-neo.com:10332, http://seed5.ngd.network:10332, https://seed1.cityofzion.io:443

========================================================================

<pre>
Node: http://108.252.121.18:10332
Owner: Unknown
Version: NEO-PYTHON:0.7.8-dev
Reported by: @jseagrave21
Issue Link (if applicable): https://github.com/CityOfZion/neo-python/issues/578
Type: Python
Issue: At least Block missing in data
Details: Block 2669088 is not represent in its blockchain, causing account balance issues
Test: JSON-RPC call:
{
        "jsonrpc": "2.0",
        "method": "getblock",
        "params": [2669088,1],
        "id": 3
}
Returns error.
Suggestion: Do not use
</pre>

<pre>
Node: https://seed1.spotcoin.com:10332
Owner: Spotcoin Team
Version: NEO:2.7.6
Reported by: @wy
Issue Link (if applicable): N/A
Type: C# NEO-CLI
Issue: Node has not synced since the dead fork incident
Details: Blockchain currently stuck at 2623810
Test: JSON-RPC call:
{
        "jsonrpc": "2.0",
        "method": "getblockcount",
        "params": [],
        "id": 3
}
Returns 2623810.
Suggestion: Do not use for any info since that block
</pre>

<pre>
Node: https://neoscan.io
Owner: adrienmo (CoZ)
Version: NEO: N/A
Reported by: @SergeyAnkarenko
Issue Link (if applicable): https://github.com/CityOfZion/neo-scan/issues/332
Type: REST Database
Issue: Node has one block incorrect due to dead fork incident
Details: Block 2623809 is incorrect
Test: https://neoscan.io/block/2623809
Returns "dfac69377247dc953a3d479e3a0bef1f06ce47ffa261a8e7390d6cefe955fddb".
Suggestion: Be careful of using this for any addresses affected by this block.
</pre>
