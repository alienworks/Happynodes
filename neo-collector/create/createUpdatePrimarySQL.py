import psycopg2
import requests
import json
import time
import socket
import dns.resolver
import socket
import os
import sys
import requests
import time
import logging

PGHOST = str(os.environ['PGHOST'])
PGDATABASE = str(os.environ['PGDATABASE'])
PGUSER = str(os.environ['PGUSER'])
PGPASSWORD = str(os.environ['PGPASSWORD'])

CONNECTION_STR = "dbname='{}' user='{}' host='{}' password='{}'".format(PGDATABASE, PGUSER, PGHOST, PGPASSWORD)

SLEEP_TIME = 60*60*24

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# create console handler and set level to debug
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

# create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# add formatter to ch
ch.setFormatter(formatter)

# add ch to logger
logger.addHandler(ch)


class CreateUpdatePrimarySQL:
    def __init__(self, connect_str, sleeptime):
        self.connect_str=connect_str
        self.sleeptime = sleeptime

    def get_coz_mainnet_json(self):
        r = requests.get(
            'https://raw.githubusercontent.com/CityOfZion/neo-mon/master/docs/assets/mainnet.json')
        return json.loads(r.text)

    def get_existing_nodes(self, cursor):
        # For mainnet json, we use hostname to check whether a node
        # exists in our database, since there is a chance that 
        # that a node has multiple ips for load-balancing
        nodes_dict = {}
        cursor.execute("select id, hostname, ip from nodes")
        results = cursor.fetchall()

        for id, hostname, ip in results:
            nodes_dict[hostname] = (id, hostname, ip)

        return nodes_dict

    def create_or_update_nodes_rows(self, data):
        conn = psycopg2.connect(self.connect_str)
        cursor = conn.cursor()

        for endpoint in data["sites"]:
            if endpoint["type"] == "RPC":
                hostname = endpoint["url"].split("//")[-1].split(":")[0]
                ip = socket.gethostbyname(endpoint["url"])

                nodes_dict = self.get_existing_nodes(cursor)
                
                if hostname not in nodes_dict:
                    # add new rows in nodes
                    logger.info("insert new rows into nodes table. hostname: {} ip: {}".format(hostname, ip))
                    cursor.execute(
                        "INSERT INTO nodes (hostname, ip) VALUES (%s, %s)", [hostname, ip])
                else:
                    (id, hostnameFromDatabase, ipFromDatabase) = nodes_dict[hostname]

                    if ipFromDatabase!=ip:
                        # IP has changes, some nodes uses loadbalancing and changes their ip all the time
                        logger.info("update node's ip. hostname: {} id: {} ipFromDatabase: {} ip:{}".format(hostname, id, ipFromDatabase, ip))
                        cursor.execute("UPDATE nodes SET ip=%s WHERE id=%s;", [ip, id])

        conn.commit()
        cursor.close()
        conn.close()
    
    def create_connectionendpoints_rows(self, data):
        conn = psycopg2.connect(self.connect_str)
        cursor = conn.cursor()
        for endpoint in data["sites"]:
            if endpoint["type"] == "RPC":
                hostname = endpoint["url"].split("//")[-1].split(":")[0]
                ip = socket.gethostbyname(endpoint["url"])

                nodes_dict = self.get_existing_nodes(cursor)
                (node_id,  hostnameFromDatabase, ipFromDatabase) = nodes_dict[hostname]

                protocol = endpoint["protocol"]
                port = endpoint["port"] if "port" in endpoint else 10332

                cursor.execute("SELECT id, node_id, protocol, port FROM public.connection_endpoints where node_id=%s and protocol=%s and port=%s", [int(node_id),str(protocol),int(port)])

                results = cursor.fetchall()

                if len(results)==0:
                    # this connection endpoints does not exist in the database
                    logger.info("insert into connection endpoints, hostname:{}  node_id: {} protocol: {} port: {}".format(hostname, int(node_id), str(protocol), int(port)))
                    cursor.execute("INSERT INTO public.connection_endpoints  (node_id, protocol, port) VALUES (%s, %s, %s) RETURNING id", [int(node_id), str(protocol), int(port)])

                    lastid = cursor.fetchone()[0]

                    cursor.execute("INSERT INTO locale (connection_id, locale) VALUES (%s, %s)"
                                    , [lastid, endpoint["locale"]])
                    cursor.execute("INSERT INTO location (connection_id, location) VALUES (%s, %s)"
                                , [lastid, endpoint["location"]])
                    
                    response = requests.get("https://geoip.nekudo.com/api/"+ip)
                    json_data = json.loads(response.text)

                    lat = json_data["location"]['latitude']
                    long = json_data["location"]['longitude']

                    cursor.execute("INSERT INTO coordinates (connection_id, lat, long) VALUES (%s, %s, %s)", [lastid, lat, long])
        conn.commit()
        cursor.close()
        conn.close()

    def run(self):
        while True:
            coz_main_net_info = self.get_coz_mainnet_json()
            self.create_or_update_nodes_rows(coz_main_net_info)
            self.create_connectionendpoints_rows(coz_main_net_info)

            logger.info("Sleeping")
            # Run hourly
            time.sleep(self.sleeptime) 

if __name__ == "__main__":
    createUpdatePrimarySQL = CreateUpdatePrimarySQL(CONNECTION_STR, SLEEP_TIME)
    createUpdatePrimarySQL.run()