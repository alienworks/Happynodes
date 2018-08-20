import psycopg2
import requests
import json
import time
import socket
import dns.resolver
import socket
import os
import requests
import time

resolver = dns.resolver.Resolver(configure=False)
resolver.nameservers = ["208.67.222.222", "208.67.220.220", 
                        '8.8.8.8', '2001:4860:4860::8888',
                        '8.8.4.4', '2001:4860:4860::8844']

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(
    databasename, user, host, password)

print(connection_str)

def get_coz_mainnet_json():
    r = requests.get(
        'https://raw.githubusercontent.com/CityOfZion/neo-mon/master/docs/assets/mainnet.json')
    return json.loads(r.text)

def get_existing_nodes(cursor):
    # For mainnet json, we use hostname to check whether a node
    # exists in our database, since there is a chance that 
    # that a node has multiple ips for load-balancing
    nodes_dict = {}
    cursor.execute("select id, hostname, ip from nodes")
    results = cursor.fetchall()

    for id, hostname, ip in results:
        nodes_dict[hostname] = (id, hostname, ip)

    return nodes_dict

def create_or_update_nodes_rows(cursor, data):
    for endpoint in data["sites"]:
        if endpoint["type"] == "RPC":
            hostname = endpoint["url"].split("//")[-1].split(":")[0]
            ip = socket.gethostbyname(endpoint["url"])

            nodes_dict = get_existing_nodes(cursor)
            
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
    
def check_mainnet_json(data):
    # Check if the mainnet has the correct key and structure that is expected
    if "sites" not in data or "name" not in data or "pollTime" not in data:
        return False
    
    for site in data["sites"]:
        if "url" not in site or "locale" not in site or "location" not in site or "type" not in site:
            return False
    return True

def create_connectionendpoints_rows(cursor, data):
    key = 0
    for endpoint in data["sites"]:
        if endpoint["type"] == "RPC":
            hostname = endpoint["url"].split("//")[-1].split(":")[0]
            ip = socket.gethostbyname(endpoint["url"])

            nodes_dict = get_existing_nodes(cursor)

            (node_id,  hostnameFromDatabase, ipFromDatabase) = nodes_dict[hostname]

            protocol = endpoint["protocol"]
            port = endpoint["port"] if "port" in endpoint else 10332

            cursor.execute("SELECT id, node_id, protocol, port FROM public.connection_endpoints where node_id=%s and protocol=%s and port=%s", [int(node_id),str(protocol),int(port)])

            rows = cursor.fetchall()

            if len(rows)==0:
                # this connection endpoints does not exist in the database
                print("insert into connection endpoints, hostname:{}  node_id: {} protocol: {} port: {}".format(hostname, int(node_id), str(protocol), int(port)))
                cursor.execute("INSERT INTO public.connection_endpoints  (node_id, protocol, port) VALUES (%s, %s, %s) RETURNING id", [int(node_id), str(protocol), int(port)])

                lastid = cursor.fetchone()[0]

                cursor.execute("INSERT INTO locale (connection_id, locale) VALUES (%s, %s)", [
                               lastid, endpoint["locale"]])
                cursor.execute("INSERT INTO location (connection_id, location) VALUES (%s, %s)", [
                               lastid, endpoint["location"]])

                response = requests.get("https://geoip.nekudo.com/api/"+ip)
                json_data = json.loads(response.text)

                lat = json_data["location"]['latitude']
                long = json_data["location"]['longitude']

                cursor.execute("INSERT INTO coordinates (connection_id, lat, long) VALUES (%s, %s, %s)", [lastid, lat, long])
        
if __name__ == "__main__":
    while True:
        connect_str = connection_str

        conn = psycopg2.connect(connect_str)

        cursor = conn.cursor()

        data = get_coz_mainnet_json()

        if check_mainnet_json(data):
            create_or_update_nodes_rows(cursor, data)
            conn.commit()

            create_connectionendpoints_rows(cursor, data)
            conn.commit()

            cursor.close()
            conn.close()
        else:
            raise ValueError("mainnet.json file is not in the right format")

        # sleep for a day
        time.sleep(60*60*24)


