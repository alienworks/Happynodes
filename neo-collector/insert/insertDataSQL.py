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
import redis
import dns.resolver
import aiohttp
import asyncio
import time
import asyncio
import ssl
ssl.match_hostname = lambda cert, hostname: True

JSON_RPC_HTTPS_PORT=10331
JSON_RPC_HTTP_PORT=10332

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

dsn = "postgresql://{}:{}@{}/{}".format(user, password, host, databasename)
MIN_CON = 1
MAX_CON = 800
tcp = ThreadedConnectionPool(MIN_CON, MAX_CON, dsn)

def getSqlDateTime(ts):
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')

async def callEndpoint(url, method):
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json={'jsonrpc': '2.0', 'method': method, 'params': [], 'id': 1}) as response:
                result = await response.text()
                # print(url, result)
                try:
                    result = json.loads(result)
                except json.decoder.JSONDecodeError as e:
                    return None
                return result
        except (aiohttp.InvalidURL, aiohttp.ClientConnectorError) as e:
            return None

async def testPort(url, port):
    url = url.split(":")[0]
    url = url + ":" + str(port)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}) as response:
                return await response.status_code >=200 or response.status_code<300
        except (aiohttp.InvalidURL, aiohttp.ClientConnectorError) as e:
            return False


async def getLatency(url):
    start = time.time()
    timeout = aiohttp.ClientTimeout(total=3)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}, timeout=timeout) as response:
                result = await response.text()
                end = time.time()
                return (end-start)
        except (aiohttp.InvalidURL, aiohttp.ClientConnectorError) as e:
            print(url, "Bad URL or Bad connection")
            return None
        except (asyncio.TimeoutError) as e:
            print(url, "Timeout")
            return None

async def update(url, connectionId):
    conn = None
    cursor = None

    latencyResult = await getLatency(url)
    if latencyResult != None:
        blockcountResult = await callEndpoint(url, 'getblockcount')
        versionResult = await callEndpoint(url, 'getversion')
        connectioncountResult = await callEndpoint(url, 'getconnectioncount')
        rawmempoolResult = await callEndpoint(url, 'getrawmempool')
        peersResult = await callEndpoint(url, 'getpeers')
        # rpc_https_service = await testPort(url,JSON_RPC_HTTPS_PORT)
        # rpc_http_service = await testPort(url,JSON_RPC_HTTP_PORT)

    #     conn = tcp.getconn()
    #     cursor = conn.cursor()

    #     t0 = time.time()
    #     insertOnlineInfo(cursor, connectionId, True)
    #     insertLatencyInfo(cursor, connectionId, latencyResult)
    #     insertBlockInfo(cursor, connectionId, blockcountResult)
    #     insertVersionInfo(cursor, connectionId, versionResult)
    #     insertConnectionCount(cursor, connectionId, connectioncountResult)
    #     insertMempoolSizeInfo(cursor, connectionId, rawmempoolResult, blockcountResult)
    #     insertRpcHttpsServiceInfo(cursor, connectionId, rpc_https_service)
    #     insertRpcHttpServiceInfo(cursor, connectionId, rpc_http_service)
    #     t1 = time.time()
    #     print('SQL Took %.2f ms' % (1000*(t1-t0)))
    # else:
    #     t0 = time.time()
    #     conn = tcp.getconn()
    #     cursor = conn.cursor()
    #     insertOnlineInfo(cursor, connectionId, False)
    #     insertLatencyInfo(cursor, connectionId, 2000)
    #     t1 = time.time()
    #     print('SQL Took %.2f ms' % (1000*(t1-t0)))
    
    # conn.commit()
    # tcp.putconn(conn)
    print(url, "done")

def insertRpcHttpsServiceInfo(cursor, connectionId, rpc_https_service): 
    cursor.execute("INSERT INTO rpc_https_status_history (ts, connection_id, rpc_https_status) VALUES (%s, %s, %s)"
        , [getSqlDateTime(time.time()), connectionId, rpc_https_service])

def insertRpcHttpServiceInfo(cursor, connectionId, rpc_http_service):
    cursor.execute("INSERT INTO rpc_http_status_history (ts, connection_id, rpc_http_status) VALUES (%s, %s, %s)"
        , [getSqlDateTime(time.time()), connectionId, rpc_http_service])

def insertMempoolSizeInfo(cursor, connectionId, mempool, blockcountResult):
    cursor.execute("INSERT INTO mempool_size_history (ts, connection_id, mempool_size) VALUES (%s, %s, %s)"
        , [getSqlDateTime(time.time()), connectionId, len(mempool["result"])])
    
    # Need to run this seperately
    # if len(mempool["result"]) > 0:
    #     data = []
    #     for tx in mempool["result"]:
    #         data.append((str(blockcountResult['result']), str(connectionId), str(tx)))
    #     cursor.executemany("INSERT INTO unconfirmed_tx (last_blockheight, connection_id, tx) VALUES (%s, %s, %s)", data)

def insertVersionInfo(cursor, connectionId, version):
    cursor.execute("INSERT INTO version_history (ts, connection_id, version) VALUES (%s, %s, %s)"
        , [getSqlDateTime(time.time()), connectionId, version["result"]['useragent']])

def insertConnectionCount(cursor, connectionId, connectioncountResult):
    # print(connectioncountResult)
    cursor.execute("INSERT INTO connection_counts_history (ts, connection_id, connection_counts) VALUES (%s, %s, %s)"
        , [getSqlDateTime(time.time()), connectionId, connectioncountResult['result']])

def insertBlockInfo(cursor, connectionId, height):
    cursor.execute("INSERT INTO blockheight_history (ts, connection_id, blockheight) VALUES (%s, %s, %s)", [
                   getSqlDateTime(time.time()), connectionId, height["result"]])

def insertOnlineInfo(cursor, connectionId, isOnline):
    cursor.execute("INSERT INTO online_history (ts, connection_id, online) VALUES (%s, %s, %s)", [
                   getSqlDateTime(time.time()), connectionId, isOnline])

def insertLatencyInfo(cursor, connectionId, latency):
    cursor.execute("INSERT INTO latency_history (ts, connection_id, latency_history) VALUES (%s, %s, %s)", [
                   getSqlDateTime(time.time()), connectionId, latency])

async def main():
    conn = psycopg2.connect("dbname='{}' user='{}' host='{}' password='{}'".format(databasename, user, host, password))
    cursor = conn.cursor()
    cursor.execute("""SELECT endpoint.id, 
                    concat(endpoint.protocol, '://', n.hostname,':' , endpoint.port) AS url 
                    FROM connection_endpoints endpoint  
                    INNER JOIN nodes n  
                    ON n.id=endpoint.node_id""")
    results = cursor.fetchall()
    list_of_coroutines = []

    for id, url in results:
        list_of_coroutines.append(update(url, id))
    t0 = time.time()
    # await asyncio.wait([
    #     update("http://node2.sgp1.bridgeprotocol.io:10332", 24),
    #     update("https://pyrpc3.narrative.org:443", 38),
    #     update("https://pyrpc1.narrative.org:443", 36),
    #     update("https://pyrpc4.narrative.org:443", 39),
    #     update("https://pyrpc2.narrative.org:443", 37)
    # ])
    await asyncio.wait(list_of_coroutines[:100])
    t1 = time.time()
    print('Took %.2f ms' % (1000*(t1-t0)))


loop = asyncio.get_event_loop()
loop.run_until_complete(main())
loop.close()