import psycopg2
import psycopg2.extras
import time
import os
import socket
import requests
import json
import logging
import schedule

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# create console handler and set level to debug
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

# create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# add formatter to ch
ch.setFormatter(formatter)

# add ch to logger
logger.addHandler(ch)

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(
                databasename, user, host, password)

class NodeObject:
    def __init__(self, node_id, url, ip):
        self.node_id = node_id
        self.url = url
        self.ip = ip

        self.endpointHttp10331 = ("http://" + url + ":10331", False)
        self.endpointHttps10331 = ("https://" + url + ":10331", False)
        self.endpointHttp10332 = ("http://" + url + ":10332", False)
        self.endpointHttps10332 = ("https://" + url + ":10332", False)

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
        # convert from ipv6 to ipv4
        ip = neighbour['address'].split("::ffff:")[-1]
        remote_nodes.append(NodeObject(None, ip, ip))
    return remote_nodes

def checkEndpoint(nodeEndpoint):
    endpoint=nodeEndpoint
    neighbours = []
    
    try:
        res = requests.post(endpoint[0], 
            json={'jsonrpc': '2.0', 'method': 'getpeers', 'params': [], 'id': 1}
            , timeout=2)
        neighbourstHttp10331 = json.loads(res.text)['result']['connected']
        neighbours = neighbourstHttp10331

        logger.info("Found endpoint  {}".format(endpoint[0]))
        return (endpoint[0], True), neighbours
    except:
        logger.info("Fails endpoint  {}".format(endpoint[0]))
        return (endpoint[0], False), neighbours
    
def bfs(nodesList):
    explored = []
    queue = nodesList

    while queue:
        node = queue.pop(0)
        if nodeNotExplored(node, explored):
            explored.append(node)
            neighbours = []

            node.endpointHttp10331, n = checkEndpoint(node.endpointHttp10331)
            neighbours += n

            node.endpointHttps10331, n = checkEndpoint(node.endpointHttps10331)
            neighbours += n

            node.endpointHttp10332, n = checkEndpoint(node.endpointHttp10332)
            neighbours += n

            node.endpointHttps10332, n = checkEndpoint(node.endpointHttps10332)
            neighbours += n

            if len(neighbours) == 0:
                continue

            remoteNodes = getRemoteNodes(neighbours)
            logger.info("Found {} remoteNodes".format(len(remoteNodes)))

            for n in remoteNodes:
                queue.append(n)

            logger.info("Found {} explored".format(len(explored)))

            if len(explored)>20:
                break
    return explored

def getNodeList(cursor):
    cursor.execute("""select id, hostname, ip from nodes""")
    rows = cursor.fetchall()

    list_of_nodes = []
    for node_id, node_url, node_ip in rows:
        n = NodeObject(node_id, node_url, node_ip)
        list_of_nodes.append(n)

    return list_of_nodes

def insertNewNodes(cursor, exploredNodes):
    nodes_to_be_inserted = []
    for explored in exploredNodes:
        cursor.execute("""select * 
                            from nodes n
                            where n.ip=%s""", [explored.ip])
        
        rows = cursor.fetchall()
        if len(rows) == 0:
            if explored.endpointHttp10331[1] or explored.endpointHttps10331[1] \
                or explored.endpointHttp10332[1] or explored.endpointHttps10332[1]:
                nodes_to_be_inserted.append(explored)

    sqlInsert = [(e.ip, e.ip) for e in nodes_to_be_inserted]
    psycopg2.extras.execute_values(cursor,  "INSERT INTO nodes (hostname, ip) VALUES %s", sqlInsert)

    return nodes_to_be_inserted


def insertNewEndpoints(cursor, exploredNodes):
    sqlInsert = []
    for explored in exploredNodes:
        cursor.execute(
                """SELECT id, hostname, ip
                        FROM nodes n
                        WHERE n.ip=%s """, [explored.ip])
        nodeId = cursor.fetchone()[0]

        if explored.endpointHttp10331[1]:
            sqlInsert.append((nodeId, "http", 10331))

        if explored.endpointHttps10331[1]:
            sqlInsert.append((nodeId, "https", 10331))

        if explored.endpointHttp10332[1]:
            sqlInsert.append((nodeId, "http", 10332))

        if explored.endpointHttps10332[1]:
            sqlInsert.append((nodeId, "https", 10332))
    
    psycopg2.extras.execute_values(cursor,  
                                    "INSERT INTO connection_endpoints (node_id, protocol, port) VALUES %s"
                                    , sqlInsert)

def insertEndpointLocation(cursor, nodeId, protocol, port, lat, long, locale, location):
    cursor.execute("""SELECT id, node_id, protocol, port
                                FROM public.connection_endpoints
                                where node_id=%s and protocol=%s and port=%s """, 
                                [nodeId, protocol, port])
            
    endpointId = cursor.fetchone()[0]

    cursor.execute("INSERT INTO coordinates (connection_id, lat, long) VALUES (%s, %s, %s)"
                    , [endpointId, lat, long])
    cursor.execute("INSERT INTO locale (connection_id, locale) VALUES (%s, %s)", [
                        endpointId, locale])
    cursor.execute("INSERT INTO location (connection_id, location) VALUES (%s, %s)", [
                    endpointId, location])

def insertNewEndpointsInfo(cursor, exploredNodes):
    for explored in exploredNodes:
        cursor.execute(
                """SELECT id, hostname, ip
                        FROM nodes n
                        WHERE n.ip=%s """, 
                        [explored.ip])
        nodeId = cursor.fetchone()[0]

        response = requests.get("https://geoip.nekudo.com/api/" + explored.ip)
        json_data = json.loads(response.text)

        lat = json_data["location"]['latitude']
        long = json_data["location"]['longitude']
        location = json_data["country"]['name']
        locale = json_data["country"]['code']
        locale = locale.lower()

        if explored.endpointHttp10331[1]:
            insertEndpointLocation(cursor, nodeId, "http", 10331, lat, long, locale, location)

        if explored.endpointHttps10331[1]:
            insertEndpointLocation(cursor, nodeId, "https", 10331, lat, long, locale, location)

        if explored.endpointHttp10332[1]:
            insertEndpointLocation(cursor, nodeId, "http", 10332, lat, long, locale, location)

        if explored.endpointHttps10332[1]:
            insertEndpointLocation(cursor, nodeId, "https", 10332, lat, long, locale, location)
def job():
    conn = psycopg2.connect(connection_str)
    cursor = conn.cursor()
    listOfNodes = getNodeList(cursor)

    exploredNodes = bfs(listOfNodes)

    logger.info("BFS done")

    logger.info("Explored Nodes {}".format(exploredNodes))

    print([(n.node_id, n.url, n.ip, n.endpointHttp10331, n.endpointHttps10331, 
        n.endpointHttp10332, n.endpointHttps10332) for n in exploredNodes])

    insertNewNodes(cursor, exploredNodes)
    conn.commit()

    insertNewEndpoints(cursor, exploredNodes)
    conn.commit()

    insertNewEndpointsInfo(cursor, exploredNodes)
    conn.commit()
    conn.close()
    return

if __name__ == "__main__":
    job()
    schedule.every().day.at("01:00").do(job)
    while True:
        schedule.run_pending()
        time.sleep(60)