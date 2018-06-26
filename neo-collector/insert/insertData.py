from neorpc.Settings import SettingsHolder
from Client import RPCClient, RPCEndpoint
import psycopg2
import requests
import json
import time
import datetime
import queue
import threading
import random
from psycopg2.pool import ThreadedConnectionPool
import os

import dns.resolver

JSON_RPC_HTTPS_PORT=10331
JSON_RPC_HTTP_PORT=10332
P2P_TCP_PORT=10333
P2P_WS_PORT=10334


host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(databasename, user, host, password)
dsn="postgresql://{}:{}@{}/{}".format(user, password, host, databasename)

print(connection_str)
print(dsn)

MIN_CON = 1
MAX_CON = 800
tcp = ThreadedConnectionPool(MIN_CON, MAX_CON, dsn)

def getSqlDateTime(ts):
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')

def getIpId(cursor):
    address_dict = {}
    cursor.execute("SELECT * FROM ip;")
    ip_list = cursor.fetchall()
    for source in ip_list:
        ip_id, address_id, ip = source
        address_dict[ip] = (ip_id, address_id, ip)
    return address_dict

def getAddressId(cursor):
    address_dict = {}
    cursor.execute("SELECT * FROM address;")
    address_list = cursor.fetchall()
    for source in address_list:
        addressId, addressname = source
        address_dict[addressId] = (addressId, addressname)
    dict_address_port = {}
    cursor.execute("SELECT * FROM port;")
    port_list = cursor.fetchall()
    for source in port_list:
        portId, address_id, port = source
        addressId, addressname = address_dict[address_id]
        dict_address_port[addressname] = (addressId, addressname, port)       
    return dict_address_port, address_dict

def getProtocol(cursor):
    protocol_dict = {}
    cursor.execute("SELECT * FROM protocol;")
    protocol_list = cursor.fetchall()
    for source in protocol_list:
        _, addressId, protocol = source
        protocol_dict[addressId] = protocol
    return protocol_dict

def get_lantency(addr):
    start = time.time()
    response = requests.post(addr, json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}, )
    end = time.time()
    return (end - start)

def test_port(addr, port):
    url = addr.split(":")[0]
    url = url + ":" + str(port)
    try:
        response = requests.post(addr, 
            json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}, 
            verify=False, timeout=10)
    except:
        return False
    return response.status_code >=200 or response.status_code<300

def chunkIt(seq, num):
    avg = len(seq) / float(num)
    out = []
    last = 0.0

    while last < len(seq):
        out.append(seq[int(last):int(last + avg)])
        last += avg
    return out

if __name__ == "__main__":
    conn = psycopg2.connect(connection_str)

    cursor = conn.cursor()
    
    dict_address_port, address_dict = getAddressId(cursor)

    protocol_dict = getProtocol(cursor)

    list_of_address = [protocol_dict[dict_address_port[key][0]] + "://"+key+":"+str(dict_address_port[key][2]) for key in dict_address_port]

    settings = SettingsHolder()

    settings.setup(list_of_address)

    client = RPCClient(config=settings)

    ip_dict = getIpId(cursor)

    resolver = dns.resolver.Resolver(configure=False)
    resolver.nameservers = ["208.67.222.222", "208.67.220.220", '8.8.8.8', '2001:4860:4860::8888',
                        '8.8.4.4', '2001:4860:4860::8844']

    def update(endpoints, client, dict_address_port):
        # Avoid synchronisation
        time.sleep(random.uniform(0, 1)*10)
        
        while True:
            for endpoint in endpoints:
                try:
                    conn = tcp.getconn()

                    cursor = conn.cursor()

                    time.sleep(random.uniform(0, 1)*10)
                    
                    dict_address_port, address_dict = getAddressId(cursor)

                    address = endpoint.addr
                    print("=========================================================")
                    print("address: {}".format(address))

                    address_dict_key = address.split("://")[1].split(":")[0]
                    addressId, addressname, port = dict_address_port[address_dict_key]
                    
                    try:
                        endpoint.setup() 
                        print("online")
                        cursor.execute("INSERT INTO online_history (ts, address_id, online) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, True])
                    except:
                        print("OFFLINE")
                        cursor.execute("INSERT INTO online_history (ts, address_id, online) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, False])
                        cursor.execute("INSERT INTO latency_history (ts, address_id, latency_history) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, 200])
                        conn.commit()
                        tcp.putconn(conn)
                        continue

                    height = client.get_height(endpoint=endpoint)
                    print("{} Blockheight: {}".format(address, height))
                    cursor.execute("INSERT INTO blockheight_history (ts, address_id, blockheight) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, height])

                    latency = get_lantency(endpoint.addr)
                    print("Latency: {}".format(latency))
                    cursor.execute("INSERT INTO latency_history (ts, address_id, latency_history) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, latency])
                    try:
                        version = client.get_version(endpoint=endpoint)
                    except:
                        print("Unable to get version information")
                        version = None

                    print("version: {}".format(version))
                    if version == None:
                        cursor.execute("INSERT INTO version_history (ts, address_id, version) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, "Unknown"])
                    else:
                        cursor.execute("INSERT INTO version_history (ts, address_id, version) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, version['useragent']])

                    connection_counts = client.get_connection_count(endpoint=endpoint)
                    print("connection_counts: {}".format(connection_counts))
                    cursor.execute("INSERT INTO connection_counts_history (ts, address_id, connection_counts) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, connection_counts])

                    raw_mempool = client.get_raw_mempool(endpoint=endpoint)
                    if raw_mempool is None:
                        print("mempool tx count: {}".format(0))
                        cursor.execute("INSERT INTO mempool_size_history (ts, address_id, mempool_size) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, 0])
                    else:
                        print("mempool tx count: {}".format(len(raw_mempool)))
                        cursor.execute("INSERT INTO mempool_size_history (ts, address_id, mempool_size) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, len(raw_mempool)])
                        if height:
                            for tx in raw_mempool:
                                cursor.execute("INSERT INTO unconfirmed_tx (last_blockheight, address_id, tx) VALUES (%s, %s, %s)", [height, addressId, tx])

                    rcp_https_service = test_port(address,JSON_RPC_HTTPS_PORT)
                    rcp_http_service = test_port(address,JSON_RPC_HTTP_PORT)

                    if rcp_https_service:
                        print("JSON_RPC_HTTPS_PORT okay")
                        cursor.execute("INSERT INTO rcp_http_status_history (ts, address_id, rcp_http_status) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, True])
                    else:
                        print("JSON_RPC_HTTPS_PORT not avaliable")
                        cursor.execute("INSERT INTO rcp_http_status_history (ts, address_id, rcp_http_status) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, False])

                    if rcp_http_service:
                        print("JSON_RPC_HTTP_PORT okay")
                        cursor.execute("INSERT INTO rcp_https_status_history (ts, address_id, rcp_https_status) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, True])
                    else:
                        print("JSON_RPC_HTTP_PORT not avaliable")
                        cursor.execute("INSERT INTO rcp_https_status_history (ts, address_id, rcp_https_status) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, False])

                    try:
                        peers = client.get_peers(endpoint=endpoint)

                        if peers == None:
                            print("peers is none")
                            cursor.execute("INSERT INTO validated_peers_counts_history (ts, address_id, validated_peers_counts) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, 0])
                        else:
                            print("peers is not none")
                            validated_peers = 0

                            peers = [ i['address'] for i in peers['connected']]
                            peers = set(peers)

                            insert_time = time.time()
                            
                            for connected_peer in peers:
                                if '::ffff:' in connected_peer:
                                    peer_address = connected_peer.split('::ffff:')[1]
                                else:
                                    peer_address = connected_peer

                                if peer_address.split('.')[0]=="10":
                                    continue  
                                    
                                if peer_address not in ip_dict:
                                    continue
        
                                _, validated_peer_address_id, _ = ip_dict[peer_address]    
                                
                                cursor.execute("INSERT INTO validated_peers_history (ts, address_id, validated_peers_address_id) VALUES (%s, %s, %s)", [getSqlDateTime(insert_time), addressId, validated_peer_address_id])
                                
                                validated_peers+=1 
                            cursor.execute("INSERT INTO validated_peers_counts_history (ts, address_id, validated_peers_counts) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, validated_peers])

                    except Exception as e:
                        print(e)
                        cursor.execute("INSERT INTO validated_peers_counts_history (ts, address_id, validated_peers_counts) VALUES (%s, %s, %s)", [getSqlDateTime(time.time()), addressId, 0])
                        
                    print("=========================================================")
                    conn.commit()
                    tcp.putconn(conn)
                    continue
                except Exception as e:
                    print(e)
                    conn.commit()
                    tcp.putconn(conn)
                    continue

    chuncksOfEndpoints = chunkIt(client.endpoints, 20)
    for endpoints in chuncksOfEndpoints:
        t = threading.Thread(target=update, args = (endpoints, client, dict_address_port))
        t.daemon = True
        t.start()

    while True:
        # print("sleeping")
        time.sleep(1)
