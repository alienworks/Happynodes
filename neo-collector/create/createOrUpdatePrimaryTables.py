import psycopg2
import requests
import json
import time
import socket
import dns.resolver
import socket
import os
import requests

resolver = dns.resolver.Resolver(configure=False)
resolver.nameservers = ["208.67.222.222", "208.67.220.220", '8.8.8.8', '2001:4860:4860::8888',
                        '8.8.4.4', '2001:4860:4860::8844']

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(
    databasename, user, host, password)
dsn = "postgresql://{}:{}@{}/{}".format(user, password, host, databasename)

print(connection_str)

def get_coz_mainnet_json():
    r = requests.get(
        'https://raw.githubusercontent.com/CityOfZion/neo-mon/master/docs/assets/mainnet.json')
    return json.loads(r.text)

def get_existed_nodes(cursor):
    # For mainnet json, we use hostanme to check whether a node
    # exists in our database, since there is a chance that 
    # that a node has multiple ips for load-balancing
    nodes_dict = {}
    cursor.execute("select id, hostname, ip from nodes")
    results = cursor.fetchall()

    for id, hostname, ip in results:
        nodes_dict[hostname] = (id, hostname, ip)

    return nodes_dict

def get_existed_connections(cursor):
    connections_dict = {}
    cursor.execute("select id, hostname, node_id, protocol, port from connection_endpoints")

    results = cursor.fetchall()

    for id, hostname, node_id, protocol, port in results:
        connections_dict[hostname] = (id, hostname, node_id, protocol, port)

    return connections_dict


def create_or_update_nodes_rows(cursor, data):
    key = 0
    for endpoint in data["sites"]:
        if endpoint["type"] == "RPC":
            hostname = endpoint["url"].split("//")[-1].split(":")[0]
            ip = socket.gethostbyname(endpoint["url"])

            nodes_dict = get_existed_nodes(cursor)
            
            if hostname not in nodes_dict:
                # add new rows in nodes
                print("insert new rows into nodes table. hostname: {} ip: {}".format(hostname, ip))
                cursor.execute(
                    "INSERT INTO nodes (hostname, ip) VALUES (%s, %s)", [hostname, ip])
            else:
                (id, hostnameFromDatabase, ipFromDatabase) = nodes_dict[hostname]

                if ipFromDatabase!=ip:
                    # IP has changes, some nodes uses loadbalancing and changes their ip all the time
                    print("update node's ip. hostname: {} id: {} ipFromDatabase: {} ip:{}".format(hostname, id, ipFromDatabase, ip))
                    cursor.execute("UPDATE nodes SET ip=%s WHERE id=%s;", [ip, id])
            
            # Update old connections table hack  
            # node_id = nodes_dict[hostname][0]
            # port = endpoint["port"] if "port" in endpoint else 10332
            # protocol = endpoint["protocol"]
            # print("info {} {} {} {} {}".format(key, hostname, node_id, protocol, port))
            # cursor.execute(
            #         "update connection_endpoints SET node_id=%s, protocol=%s, port=%s WHERE id=%s and hostname=%s", [node_id, protocol, port, key, hostname])
            # key += 1
    

def create_connectionendpoints_rows(cursor, data):
    key = 0
    for endpoint in data["sites"]:
        if endpoint["type"] == "RPC":
            hostname = endpoint["url"].split("//")[-1].split(":")[0]
            ip = socket.gethostbyname(endpoint["url"])

            nodes_dict = get_existed_nodes(cursor)

            (node_id, hostnameFromDatabase, ipFromDatabase) = nodes_dict[hostname]

            protocol = endpoint["protocol"]
            port = endpoint["port"] if "port" in endpoint else 10332

            cursor.execute("SELECT id, node_id, protocol, port FROM public.connection_endpoints where node_id=%s and protocol=%s and port=%s", [int(node_id),str(protocol),int(port)])

            rows = cursor.fetchall()

            if len(rows)==0:
                # this connection endpoints does not exist in the database
                print("insert into connection endpoints, hostname:{}  node_id: {} protocol: {} port: {}".format(hostname, int(node_id), str(protocol), int(port)))
                cursor.execute("INSERT INTO public.connection_endpoints  (node_id, protocol, port) VALUES (%s, %s, %s)", [int(node_id), str(protocol), int(port)])
        
if __name__ == "__main__":
    connect_str = connection_str

    conn = psycopg2.connect(connect_str)

    cursor = conn.cursor()

    data = get_coz_mainnet_json()

    create_or_update_nodes_rows(cursor, data)
    conn.commit()

    create_connectionendpoints_rows(cursor, data)
    conn.commit()

    cursor.close()
    conn.close()

