# from neorpc.Settings import SettingsHolder
# from Client import RPCClient, RPCEndpoint
# import psycopg2
# import requests
# import json
# import time
# import datetime
# import queue
# import threading
# import random
# from psycopg2.pool import ThreadedConnectionPool
# import os
# import redis
# import dns.resolver
# import aiohttp
# import asyncio

# host = str(os.environ['PGHOST'])
# databasename = str(os.environ['PGDATABASE'])
# user = str(os.environ['PGUSER'])
# password = str(os.environ['PGPASSWORD'])

# dsn = "postgresql://{}:{}@{}/{}".format(user, password, host, databasename)

# def getSqlDateTime(ts):
#     return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')

# async def getBlockHeight(session, url):
#     async with session.post(url, json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}) as response:
#         return await response.text()

# async def main():
#     for url in ['http://node2.ams2.bridgeprotocol.io:10332', 'http://seed1.aphelion-neo.com:10332']:
#         async with aiohttp.ClientSession() as session:
#             html = await getLatency(session, 'http://node2.ams2.bridgeprotocol.io:10332')
#             print(html)

# async def getLatency(session, url):
#     start = time.time()
#     async with session.post(url, json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}) as response:
#         await response.text()
#         end = time.time()
#         return (end - start)

# if __name__ == '__main__':
#     my_event_loop = asyncio.get_event_loop()
#     try:
#         print('task creation started')
#         task_obj = my_event_loop.create_task(main())
#         my_event_loop.run_until_complete(task_obj)
#     finally:
#         my_event_loop.close()

#     print("The task's result was: {}".format(task_obj.result()))

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
import redis
import dns.resolver
import aiohttp
import asyncio
import time
import asyncio

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
                print(url, result)
                return json.loads(result)
        except (aiohttp.InvalidURL, aiohttp.ClientConnectorError) as e:
            return None

async def getLatency(url):
    start = time.time()
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}) as response:
                result = await response.text()
                end = time.time()
                return (end-start)
        except (aiohttp.InvalidURL, aiohttp.ClientConnectorError) as e:
            return None

async def update(url, connectionId):
    conn = tcp.getconn()
    cursor = conn.cursor()

    latencyResult = await getLatency(url)
    if latencyResult != None:
        blockcountResult = await callEndpoint(url, 'getblockcount')
        versionResult = await callEndpoint(url, 'getversion')
        connectioncountResult = await callEndpoint(url, 'getconnectioncount')
        rawmempoolResult = await callEndpoint(url, 'getrawmempool')
        peersResult = connectioncountResult = await callEndpoint(url, 'getpeers')

        insertOnlineInfo(cursor, connectionId, True)
        insertLatencyInfo(cursor, connectionId, latencyResult)
        insertBlockInfo(cursor, connectionId, blockcountResult)
        insertVersionInfo(cursor, connectionId, versionResult)
        insertConnectionCount(cursor, connectionId, connectioncountResult)
        insertMempoolSizeInfo(cursor, connectionId, rawmempoolResult, blockcountResult)
    else:
        # log something wrong with this endpoint
        insertOnlineInfo(cursor, connectionId, False)
        insertLatencyInfo(cursor, connectionId, 2000)
    
    # conn.commit()
    tcp.putconn(conn)

def insertMempoolSizeInfo(cursor, connectionId, mempool, blockcountResult):
    cursor.execute("INSERT INTO mempool_size_history (ts, connection_id, mempool_size) VALUES (%s, %s, %s)"
        , [getSqlDateTime(time.time()), connectionId, len(mempool["result"]['connected'])])
    for tx in mempool["result"]['connected']:
        cursor.execute("INSERT INTO unconfirmed_tx (last_blockheight, connection_id, tx) VALUES (%s, %s, %s)"
            , [blockcountResult['result'], connectionId, tx])

def insertVersionInfo(cursor, connectionId, version):
    cursor.execute("INSERT INTO version_history (ts, connection_id, version) VALUES (%s, %s, %s)"
        , [getSqlDateTime(time.time()), connectionId, version["result"]['useragent']])

def insertConnectionCount(cursor, connectionId, connectioncountResult):
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
    t0 = time.time()
    await asyncio.wait([
        update("http://node2.sgp1.bridgeprotocol.io:10332", 24),
        update("https://pyrpc3.narrative.org:443", 38),
        update("https://pyrpc1.narrative.org:443", 36),
        update("https://pyrpc4.narrative.org:443", 39),
        update("https://pyrpc2.narrative.org:443", 37)
    ])
    t1 = time.time()
    print('Took %.2f ms' % (1000*(t1-t0)))


loop = asyncio.get_event_loop()
loop.run_until_complete(main())
loop.close()