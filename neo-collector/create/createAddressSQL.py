import psycopg2
import requests
import json
import time
import socket 
import dns.resolver
from config import CONNECTION_STR

resolver = dns.resolver.Resolver(configure=False)
resolver.nameservers = ["208.67.222.222", "208.67.220.220", '8.8.8.8', '2001:4860:4860::8888',
                    '8.8.4.4', '2001:4860:4860::8844']

def open_mainnet_json():
    f = open('../mainnet.json','r')
    r = json.loads(f.read())
    return r

def insert_initial_addresses(cursor, data):
    key=0
    for i in data["sites"]:
        if i["type"]=="RPC":
            cursor.execute("INSERT INTO address (id, address) VALUES (%s, %s)", [key, i["url"]])
            if "port" in i: 
                cursor.execute("INSERT INTO port (address_id, port) VALUES (%s, %s)", [key,i["port"]])
            else:
                cursor.execute("INSERT INTO port (address_id, port) VALUES (%s, %s)", [key, 10332])
            
            cursor.execute("INSERT INTO locale (address_id, locale) VALUES (%s, %s)", [key, i["locale"]])
            cursor.execute("INSERT INTO location (address_id, location) VALUES (%s, %s)", [key, i["location"]])

            if "address" in i:
                cursor.execute("INSERT INTO ip (address_id, ip) VALUES (%s, %s)", [key, i["address"]])
            else:
                address = i["url"].split("//")[-1].split(":")[0]
                
                try:
                    public_ip = str(resolver.query(address)[0])
                except:
                    continue
                cursor.execute("INSERT INTO ip (address_id, ip) VALUES (%s, %s)", [key, public_ip])
                
            response = requests.get("http://freegeoip.net/json/"+i["url"])
            json_data = json.loads(response.text)
            lat = json_data['latitude']
            long = json_data['longitude']
            cursor.execute("INSERT INTO coordinates (address_id, lat, long) VALUES (%s, %s, %s)", [key, lat, long])
            cursor.execute("INSERT INTO protocol (address_id, protocol) VALUES (%s, %s)", [key, i["protocol"]])
            key+=1

if __name__ == "__main__":
    connect_str = CONNECTION_STR

    conn = psycopg2.connect(connect_str)

    cursor = conn.cursor()

    data = open_mainnet_json()

    insert_initial_addresses(cursor, data)

    conn.commit()
    cursor.close()
    conn.close()

