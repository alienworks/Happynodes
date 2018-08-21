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

def getSqlDateTime(ts):
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')


async def callEndpoint(url, method):
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json={'jsonrpc': '2.0', 'method': method, 'params': [], 'id': 1}) as response:
            result = await response.text()
            print(url, result)
            return result


async def getLatency(url):
    start = time.time()
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}) as response:
            result = await response.text()
            end = time.time()
            return (end-start)

async def update(url):
    await callEndpoint(url, 'getblockcount')
    await callEndpoint(url, 'getversion')
    await callEndpoint(url, 'getconnectioncount')
    await callEndpoint(url, 'getrawmempool')
    await callEndpoint(url, 'getpeers')
    await getLatency(url)


async def main():
    t0 = time.time()
    await asyncio.wait( [
        update("http://node2.sgp1.bridgeprotocol.io:10332"),
        update("https://pyrpc3.narrative.org:443"),
        update("https://pyrpc1.narrative.org:443"),
        update("https://pyrpc4.narrative.org:443"),
        update("https://pyrpc2.narrative.org:443"),
        update("http://47.91.86.105:10332"),
        update("https://pyrpc1.redpulse.com:10331"),
        update("http://seed1.aphelion-neo.com:10332"),
        update("http://seed2.ngd.network:10332"),
        update("http://178.128.198.255:10332"),
        update("http://seed6.ngd.network:10332	"),
        update("http://47.254.28.42:10332"),
        update("http://seed7.ngd.network:10332"),
        update("https://seed7.cityofzion.io:443"),
        update("http://seed5.neo.org:10332"),
        update("http://47.91.248.98:10332"),
        update("http://178.128.198.255:10332"),
        update("https://pyrpc2.redpulse.com:10331"),
        update("http://seed4.ngd.network:10332"),
        update("http://seed9.ngd.network:10332"),
        update("http://api.otcgo.cn:10332"),
        update("http://pyrpc2.redpulse.com:10332"),
        update("http://node2.nyc3.bridgeprotocol.io:10332")
        ] )
    t1 = time.time()
    print('Took %.2f ms' % (1000*(t1-t0)))
    
    
loop = asyncio.get_event_loop()
loop.run_until_complete(main())
loop.close()

    