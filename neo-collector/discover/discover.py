import psycopg2
import time
import os
from neorpc.Settings import SettingsHolder
from Client import RPCClient, RPCEndpoint
import socket
import eventlet
eventlet.monkey_patch()

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(
    databasename, user, host, password)

connect_str = connection_str

print(connect_str)

conn = psycopg2.connect(connect_str)

cursor = conn.cursor()
cursor.execute("""select id, hostname, ip from nodes""")

rows = cursor.fetchall()

client = RPCClient()


class NodeObject:
    def __init__(self, node_id, url, ip):
        self.node_id = node_id
        self.url = url
        self.ip = ip

        self.endpointHttp10331 = RPCEndpoint(client, "http://" + url + ":10331")
        self.endpointHttps10331 = RPCEndpoint(client, "https://" + url + ":10331")

        self.endpointHttp10332 = RPCEndpoint(client, "http://" + url + ":10332")
        self.endpointHttps10332 = RPCEndpoint(client, "https://" + url + ":10332")

        self.hasEndpointHttp10331 = False
        self.hasEndpointHttps10331 = False
        self.hasEndpointHttp10332 = False
        self.hasEndpointHttps10332 = False


list_of_nodes = []

for node_id, node_url, node_ip in rows:
    n = NodeObject(node_id, node_url, node_ip)
    list_of_nodes.append(n)


def bfs(list_of_nodes):
    explored = []
    queue = list_of_nodes

    while queue:
        node = queue.pop(0)
        if nodeNotExplored(node, explored):
            explored.append(node)
            print("explored.append(node)")

            try:
                print("neighbours = client.get_peers(endpoint=node.endpointHttp10331)['connected']")
                neighbours = client.get_peers(endpoint=node.endpointHttp10331)['connected']
                node.hasEndpointHttp10331=True
            except:
                try:
                    print("neighbours = client.get_peers(endpoint=node.endpointHttps10331)['connected']")
                    neighbours = client.get_peers(endpoint=node.endpointHttps10331)['connected']
                    node.hasEndpointHttps10331=True
                except:
                    try:
                        print("neighbours = client.get_peers(endpoint=node.endpointHttp10332)['connected']")
                        neighbours = client.get_peers(endpoint=node.endpointHttp10332)['connected']
                        node.hasEndpointHttp10332=True
                    except:
                        try:
                            print("neighbours = client.get_peers(endpoint=node.endpointHttps10332)['connected']")
                            neighbours = client.get_peers(endpoint=node.endpointHttps10332)['connected']
                            node.hasEndpointHttps10332=True
                        except:
                            print("failed to get any peers")
                            print("len(queue)"+ str(len(queue)))
                            print("len(explored)"+ str(len(explored)))
                            continue

            print("neighbours = client.get_peers(endpoint=node.endpoint)['connected']")
            remoteNodes = getRemoteNodes(neighbours)
            for n in remoteNodes:
                queue.append(n)
            
            # to be removed
            if len(explored)==50:
                return explored
    return explored


def isOpen(ip, port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2)
    try:
        s.connect((ip, int(port)))
        s.shutdown(2)
        return True
    except:
        return False


def nodeNotExplored(node, explored):
    for explored_node in explored:
        if explored_node.ip == node.ip:
            return False
    return True


def getRemoteNodes(neighbours):
    remote_nodes = []
    for neighbour in neighbours:
        # conert from ipv6 to ipv4
        ip = neighbour['address'].split("::ffff:")[-1]
        remote_nodes.append(NodeObject(None, ip, ip))

    return remote_nodes


explored_nodes = bfs(list_of_nodes)

for explored in explored_nodes:
    cursor.execute("""select * 
                from nodes n
                where n.ip=%s""", [explored.ip])
    rows = cursor.fetchall()
    if len(rows) == 0:
        # IP doesnt exist in database
        print(explored.ip)

