import psycopg2
import time
import os
import socket
import requests
import json
from discoverSQL import NodeObject, isOpen, getRemoteNodes, checkEndpoint
from discoverSQL import insertNewNodes, insertNewEndpoints, insertNewEndpointsInfo


host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(
        databasename, user, host, password)

fakeneighbours = [{'address': '47.254.38.194', 'port': 10333}, {'address': '18.217.92.44', 'port': 10333}]

def test_isOpen():
    result = isOpen("google.com", 80)
    assert result == True

def test_isNotOpen():
    result = isOpen("google.com", 123)
    assert result == False

def test_getRemoteNodes():
    remoteNodes=getRemoteNodes(fakeneighbours)
    assert len(remoteNodes)==2

def test_correct_endpoint_checkEndpoint():
    node = NodeObject(None, "node2.nyc3.bridgeprotocol.io", "node2.nyc3.bridgeprotocol.io")
    endpoint, neighbours = checkEndpoint(node.endpointHttp10332)
    assert len(neighbours)!=0 and endpoint[1]==True

def test_incorrect_endpoint_checkEndpoint():
    node = NodeObject(None, "node2.nyc3.bridgeprotocol.io", "node2.nyc3.bridgeprotocol.io")
    endpoint, neighbours = checkEndpoint(node.endpointHttp10331)
    assert len(neighbours)==0 and endpoint[1]==False

def test_insertNewNodes():
    conn = psycopg2.connect(connection_str)
    cursor = conn.cursor()

    fake1 = NodeObject(None, "karlson.com", "1.2.3.4")
    fake1.endpointHttp10331 = (fake1.endpointHttp10331[0], True)
    fake2 = NodeObject(None, "wing.com", "4.1.2.4")
    fake2.endpointHttp10331 = (fake2.endpointHttps10331[0], True)

    fakeEndpoints = [fake1, fake2]

    insertNewNodes(cursor, fakeEndpoints)
    conn.commit()

    cursor.execute("""select *
                    FROM public.nodes 
                    where hostname = %s""", 
                    [fake1.ip])
    
    result = cursor.fetchall()
    assert result[0][1]==fake1.ip and len(result)!=0
    
    cursor.execute("""select *
                    from public.nodes 
                    where hostname = %s""", 
                    [fake2.ip])
    
    result = cursor.fetchall()
    assert result[0][1]==fake2.ip and len(result)!=0

    cursor.execute("""delete
                    from public.nodes 
                    where hostname = %s""", 
                    [fake1.ip])

    cursor.execute("""delete
                    from public.nodes 
                    where hostname = %s""", 
                    [fake2.ip])
    conn.commit()
    conn.close()

def test_insertEndpoint():
    conn = psycopg2.connect(connection_str)
    cursor = conn.cursor()

    fake1 = NodeObject(None, "karlson.com", "1.2.3.4")
    fake1.endpointHttp10331 = (fake1.endpointHttp10331[0], True)
    fake2 = NodeObject(None, "wing.com", "4.1.2.4")
    fake2.endpointHttps10331 = (fake2.endpointHttps10331[0], True)

    fakeEndpoints = [fake1, fake2]

    insertNewNodes(cursor, fakeEndpoints)
    conn.commit()

    cursor.execute("""select *
                    FROM public.nodes 
                    where hostname = %s""", 
                    [fake1.ip])
    
    result1 = cursor.fetchall()
    assert result1[0][1]==fake1.ip and len(result1)!=0
    
    cursor.execute("""select *
                    from public.nodes 
                    where hostname = %s""", 
                    [fake2.ip])
    
    result2 = cursor.fetchall()
    assert result2[0][1]==fake2.ip and len(result2)!=0

    insertNewEndpoints(cursor, fakeEndpoints)
    conn.commit()

    cursor.execute("""select id, node_id, protocol, port
                    FROM public.connection_endpoints 
                    where node_id = %s""", 
                    [result1[0][0]])
    
    result = cursor.fetchall()
    assert result[0][2]=="http" and result[0][3]==10331 
    
    cursor.execute("""select id, node_id, protocol, port
                    FROM public.connection_endpoints 
                    where node_id = %s""", 
                    [result2[0][0]])
    result = cursor.fetchall()
    assert result[0][2]=="https" and result[0][3]==10331

    cursor.execute("""delete
                    FROM public.connection_endpoints 
                    where node_id = %s""", 
                    [result1[0][0]])
    
    cursor.execute("""delete
                    FROM public.connection_endpoints 
                    where node_id = %s""", 
                    [result2[0][0]])

    cursor.execute("""delete
                    from public.nodes 
                    where hostname = %s""", 
                    [fake1.ip])

    cursor.execute("""delete
                    from public.nodes 
                    where hostname = %s""", 
                    [fake2.ip])
    conn.commit()
    conn.close()


def test_insertNewEndpointsInfo():
    conn = psycopg2.connect(connection_str)
    cursor = conn.cursor()

    fake1 = NodeObject(None, "google.com", "google.com")
    fake1.endpointHttp10331 = (fake1.endpointHttp10331[0], True)

    fakeEndpoints = [fake1]

    insertNewNodes(cursor, fakeEndpoints)
    conn.commit()

    cursor.execute("""select *
                    FROM public.nodes 
                    where hostname = %s""", 
                    [fake1.ip])
    
    nodeResult = cursor.fetchall()
    assert nodeResult[0][1]==fake1.ip and len(nodeResult)!=0

    insertNewEndpoints(cursor, fakeEndpoints)
    conn.commit()

    cursor.execute("""select id, node_id, protocol, port
                    FROM public.connection_endpoints 
                    where node_id = %s""", 
                    [nodeResult[0][0]])
    
    connectionEndpoint = cursor.fetchall()
    assert connectionEndpoint[0][2]=="http" and connectionEndpoint[0][3]==10331 

    insertNewEndpointsInfo(cursor, fakeEndpoints)
    conn.commit()

    cursor.execute("""SELECT id, connection_id, locale
                    FROM public.locale
                    where connection_id = %s""", 
                    [connectionEndpoint[0][0]])
    locale = cursor.fetchall()
    assert len(locale)!=0
    
    cursor.execute("""SELECT id, connection_id, location
                    FROM public.location
                    where connection_id = %s""", 
                    [connectionEndpoint[0][0]])
    location = cursor.fetchall()
    assert len(location)!=0

    cursor.execute("""SELECT id, connection_id, lat, long
                    FROM public.coordinates
                    where connection_id = %s""", 
                    [connectionEndpoint[0][0]])
    coordinates = cursor.fetchall()
    assert len(coordinates)!=0

    cursor.execute("""delete
                    FROM public.locale
                    where connection_id = %s""", 
                    [connectionEndpoint[0][0]])
    
    cursor.execute("""delete
                    FROM public.location
                    where connection_id = %s""", 
                    [connectionEndpoint[0][0]])
    
    cursor.execute("""delete
                    FROM public.coordinates
                    where connection_id = %s""", 
                    [connectionEndpoint[0][0]])

    cursor.execute("""delete
                    FROM public.connection_endpoints 
                    where node_id = %s""", 
                    [nodeResult[0][0]])

    cursor.execute("""delete
                    from public.nodes 
                    where hostname = %s""", 
                    [fake1.ip])
    conn.commit()
    conn.close()

