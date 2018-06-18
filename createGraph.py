import psycopg2
import requests
import json
import time
import socket 
from neorpc.Settings import SettingsHolder
from neorpc.Client import RPCClient, RPCEnpoint
import psycopg2
import requests
import json
import time
import datetime
import queue
import threading
import random
import pprint
import socket

import dns.resolver

from config import CONNECTION_STR

def getIpId(cursor):
    address_dict = {}
    cursor.execute("SELECT * FROM ip;")
    ip_list = cursor.fetchall()
    for source in ip_list:
        ip_id, address_id, ip = source
        address_dict[ip] = (ip_id, address_id, ip)

    return address_dict

def test_port(addr, port):
    url = addr.split(":")[0]
    url = url + ":" + str(port)
    try:
        response = requests.post(addr, 
            json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}, 
            verify=False, timeout=4)
    except:
        return False
    
    return response.status_code >=200 or response.status_code<300

edge_dict = {}

connect_str = CONNECTION_STR

conn = psycopg2.connect(connect_str)

cursor = conn.cursor()

cursor.execute("SELECT * FROM ip;")

address_list_db = cursor.fetchall()

address_list_db = [address[2] for address in address_list_db]

address_list_db = set(address_list_db)

ip_dict = getIpId(cursor)

pp = pprint.PrettyPrinter(indent=4)
list_of_address = ['http://seed1.switcheo.network:10331', 'http://seed2.switcheo.network:10331', 'http://seed3.switcheo.network:10331', 'http://seed4.switcheo.network:10331', 'http://seed1.travala.com:10332', 'http://seed2.travala.com:10332', 'http://seed3.travala.com:10332', 'http://seed4.travala.com:10332', 'http://seed1.neo.org:10331', 'http://seed2.neo.org:10332', 'http://seed3.neo.org:10332', 'http://seed4.neo.org:10332', 'http://seed5.neo.org:10332', 'http://api.otcgo.cn:10332', 'http://seed1.cityofzion.io:8080', 'http://seed2.cityofzion.io:8080', 'http://seed3.cityofzion.io:8080', 'http://seed4.cityofzion.io:8080', 'http://seed5.cityofzion.io:8080', 'http://node1.ams2.bridgeprotocol.io:10332', 'http://node2.ams2.bridgeprotocol.io:10332', 'http://node1.nyc3.bridgeprotocol.io:10332', 'http://node2.nyc3.bridgeprotocol.io:10332', 'http://node1.sgp1.bridgeprotocol.io:10332', 'http://node2.sgp1.bridgeprotocol.io:10332', 'http://seed1.redpulse.com:10331', 'http://seed2.redpulse.com:10331', 'http://pyrpc1.redpulse.com:10332', 'http://pyrpc2.redpulse.com:10332', 'http://seed1.o3node.org:10332', 'http://seed2.o3node.org:10332', 'http://seed3.o3node.org:10332', 'http://pyrpc1.narrative.network:443', 'http://pyrpc2.narrative.network:443', 'http://pyrpc3.narrative.network:443', 'http://pyrpc4.narrative.network:443', 'http://seed1.aphelion-neo.com:10332', 'http://seed2.aphelion-neo.com:10332', 'http://seed3.aphelion-neo.com:10332', 'http://seed4.aphelion-neo.com:10332', 'http://pyrpc1.nodeneo.ch:10332', 'http://seed1.amchart.io:10332', 'http://seed02.cryptomunki.tech:10332', 'http://pyrpc1.neeeo.org:10332', 'http://seed1.spotcoin.com:10332']
list_of_address = set(list_of_address)
settings = SettingsHolder()
settings.setup(list_of_address)
client = RPCClient(config=settings)

resolver = dns.resolver.Resolver(configure=False)
resolver.nameservers = ["208.67.222.222", "208.67.220.220", '8.8.8.8', '2001:4860:4860::8888',
                    '8.8.4.4', '2001:4860:4860::8844']
num_non_responsive = 0
total = 0
valid_peers = 0
user_local_ip=0
for endpoint in client.endpoints:
    try:
        peers = client.get_peers(endpoint=endpoint)
    except:
        continue

    if peers == None:
        continue
    if 'connected' not in peers:
        continue
    
    striped_address = endpoint.addr.split("//")[-1].split(":")[0]

    try:
        public_ip = str(resolver.query(striped_address)[0])
    except:
        continue

    if public_ip not in ip_dict:
        print("IP not existed in dictinary")
        print(striped_address)
        print(public_ip)
        continue

    peers = [ i['address'] for i in peers['connected']]
    peers = set(peers)
    print(len(peers))
    total+=len(peers)

    find = 0
    for connected_peer in peers:
        if '::ffff:' in connected_peer:
            peer_address = connected_peer.split('::ffff:')[1]
        else:
            peer_address = connected_peer
        print(peer_address)
        print(peer_address.split('.')[0])
        if peer_address.split('.')[0]=="10":
            continue

        import os
        hostname = peer_address
        response = os.system("ping -c 1 " + hostname)

        #and then check the response...
        
            # print (hostname, 'is up!')
        if response != 0:
            print (hostname, 'is down!')
            continue
        
        if hostname not in ip_dict:
            print("responsive node that is not in our address database")

        if hostname not in edge_dict:
            edge_dict[hostname] = [public_ip]
        else:
            edge_dict[hostname].append(public_ip)

        print(public_ip)
        print(hostname)

        # if test_port("http://"+peer_address, 10332):
        #     print("there is a response")
        # else:
        #     print("there is not a response")
        # for address in address_list_db:
            
            # if address==peer_address:
            #     ip_id, address_id, ip = ip_dict[address]
            #     # print("found peers in our database")

            #     ip_id_2, address_id_2, ip_2 = ip_dict[public_ip]

            #     if address_id not in edge_dict:
            #         edge_dict[address_id] = [address_id_2]
            #     else:
            #         edge_dict[address_id].append(address_id_2)


for key in edge_dict:
    edge_list = edge_dict[key]
    edge_list = set(edge_list)
    edge_dict[key]=edge_list

for address_id in edge_dict:
    edge_list = edge_dict[address_id] 
    for address_id_2 in edge_list:
        cursor.execute("INSERT INTO edges ( address_id_1, address_id_2) VALUES (%s, %s)", [address_id, address_id_2])

conn.commit()   
conn.close()