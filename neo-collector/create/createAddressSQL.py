import psycopg2
import requests
import json
import time
import socket
import dns.resolver
import socket
import os

resolver = dns.resolver.Resolver(configure=False)
resolver.nameservers = ["208.67.222.222", "208.67.220.220", '8.8.8.8', '2001:4860:4860::8888',
                        '8.8.4.4', '2001:4860:4860::8844']

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(databasename, user, host, password)
dsn="postgresql://{}:{}@{}/{}".format(user, password, host, databasename)

def open_mainnet_json():
    f = open('../../mainnet.json', 'r')
    r = json.loads(f.read())
    return r


def getAddress(cursor):
    address_dict = {}
    reverse_address_dict = {}
    cursor.execute("SELECT addr.id, concat(proto.protocol, '://', addr.address,':' , po.port) AS url \
    FROM address addr \
    INNER JOIN protocol proto \
    ON addr.id=proto.address_Id \
    INNER JOIN port po \
    ON addr.id=po.address_Id")
    results = cursor.fetchall()

    for result in results:
        id, url = result
        address_dict[id] = url
        reverse_address_dict[url] = id
    return address_dict, reverse_address_dict


def insert_initial_addresses(cursor, data):
    address_dict, reverse_address_dict = getAddress(cursor)
    key = 0

    for i in data["sites"]:
        
        if i["type"] == "RPC":
            if key in address_dict:
                print(key)
                key += 1
                continue
            else:
                cursor.execute(
                    "INSERT INTO address (id, address) VALUES (%s, %s)", [key, i["url"]])
                if "port" in i:
                    cursor.execute("INSERT INTO port (address_id, port) VALUES (%s, %s)", [
                                   key, i["port"]])
                else:
                    cursor.execute(
                        "INSERT INTO port (address_id, port) VALUES (%s, %s)", [key, 10332])

                cursor.execute("INSERT INTO locale (address_id, locale) VALUES (%s, %s)", [
                               key, i["locale"]])
                cursor.execute("INSERT INTO location (address_id, location) VALUES (%s, %s)", [
                               key, i["location"]])

                if "address" in i:
                    cursor.execute("INSERT INTO ip (address_id, ip) VALUES (%s, %s)", [
                                   key, i["address"]])
                else:
                    address = i["url"].split("//")[-1].split(":")[0]

                    try:
                        public_ip = str(resolver.query(address)[0])
                    except:
                        continue
                    cursor.execute("INSERT INTO ip (address_id, ip) VALUES (%s, %s)", [
                                   key, public_ip])

                print(i["url"])
                print (socket.gethostbyname(i["url"]))
                ip = socket.gethostbyname(i["url"])
                response = requests.get("https://geoip.nekudo.com/api/"+ip)
                json_data = json.loads(response.text)
                lat = json_data["location"]['latitude']
                long = json_data["location"]['longitude']
                cursor.execute("INSERT INTO coordinates (address_id, lat, long) VALUES (%s, %s, %s)", [
                               key, lat, long])
                cursor.execute("INSERT INTO protocol (address_id, protocol) VALUES (%s, %s)", [
                               key, i["protocol"]])
                key += 1


if __name__ == "__main__":
    connect_str = connection_str

    conn = psycopg2.connect(connect_str)

    cursor = conn.cursor()

    data = open_mainnet_json()

    insert_initial_addresses(cursor, data)

    conn.commit()
    cursor.close()
    conn.close()
