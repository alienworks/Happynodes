import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool
import requests
import json
import time
import datetime
import random
import os
import aiohttp
import asyncio
import asyncio
import ssl
import logging
ssl.match_hostname = lambda cert, hostname: True

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

maxBlockHeight = -1

def getSqlDateTime(ts):
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')

async def callEndpoint(url, method):
    timeout = aiohttp.ClientTimeout(total=3)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json={'jsonrpc': '2.0', 'method': method, 'params': [], 'id': 1}
                , timeout=timeout) as response:
                result = await response.text()
                try:
                    result = json.loads(result)
                except json.decoder.JSONDecodeError as e:
                    return None
                ts = getSqlDateTime(time.time())
                return ts, result
        except (aiohttp.InvalidURL, aiohttp.ClientConnectorError) as e:
            return None
        except (asyncio.TimeoutError) as e:
            logger.error(url, method, "Timeout")
            return None

async def testPort(url, port):
    url = url.split(":")[0]
    url = url + ":" + str(port)
    timeout = aiohttp.ClientTimeout(total=1)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}
                , timeout=timeout) as response:
                portOkay = await response.status_code >=200 or response.status_code<300
                ts = getSqlDateTime(time.time())
                return ts, portOkay
        except (aiohttp.InvalidURL, aiohttp.ClientConnectorError) as e:
            ts = getSqlDateTime(time.time())
            return ts, False

async def getLatency(url):
    start = time.time()
    timeout = aiohttp.ClientTimeout(total=3)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}
                , timeout=timeout) as response:
                result = await response.text()
                end = time.time()
                ts = getSqlDateTime(time.time())
                return ts, (end-start)
        except (aiohttp.InvalidURL, aiohttp.ClientConnectorError) as e:
            logger.error(url, "Bad URL or Bad connection")
            return None
        except (asyncio.TimeoutError) as e:
            logger.error(url, "latency","Timeout")
            return None

async def updateEndpoint(url, connectionId):
    latencyResult = await getLatency(url)
    if latencyResult != None:
        blockcountResult = await callEndpoint(url, 'getblockcount')
        versionResult = await callEndpoint(url, 'getversion')
        connectioncountResult = await callEndpoint(url, 'getconnectioncount')
        rawmempoolResult = await callEndpoint(url, 'getrawmempool')
        peersResult = await callEndpoint(url, 'getpeers')
        rpc_https_service = await testPort(url, JSON_RPC_HTTPS_PORT)
        rpc_http_service = await testPort(url, JSON_RPC_HTTP_PORT)

        logger.info(url, "done")

        return connectionId, latencyResult, blockcountResult, versionResult, connectioncountResult,\
                rawmempoolResult, peersResult, rpc_https_service, rpc_http_service
    else:
        logger.info(url, "done")
        return connectionId, latencyResult, None, None, None, None, None, None, None
    
async def main():
    conn = psycopg2.connect("dbname='{}' user='{}' host='{}' password='{}'".format(databasename, user, host, password))
    cursor = conn.cursor()
    cursor.execute("""SELECT endpoint.id, 
                    concat(endpoint.protocol, '://', n.hostname,':' , endpoint.port) AS url 
                    FROM connection_endpoints endpoint  
                    INNER JOIN nodes n  
                    ON n.id=endpoint.node_id""")
    results = cursor.fetchall()
    logger.info("size of endpoints list ", len(results))

    t0 = time.time()
    done, pending = await asyncio.wait([updateEndpoint(url, id) for id, url in results])

    t1 = time.time()
    logger.info('Took %.2f ms' % (1000*(t1-t0)))
    return done

def updateApp():
    conn = psycopg2.connect("dbname='{}' user='{}' host='{}' password='{}'".format(databasename, user, host, password))
    cursor = conn.cursor()
    cursor.execute("select n.id,ce.id,ip \
                from connection_endpoints ce \
                inner join nodes n \
                on n.id=ce.node_id")
    ip_list = cursor.fetchall()
    ip_dict={}
    while True:
        try:
            loop = asyncio.get_event_loop()
            done = loop.run_until_complete(main())
            

            latencyData = []
            blockheightData = []
            mempoolsizeData = []
            mempoolData = []
            connectionscountData = []
            onlineData = []
            versionData = []
            rcpHttpData = []
            rcpHttpsData = []

            validatedPeersHistoryData = []
            validatedPeersCountData = []

            numTimeout=0

            
            for ip_id, address_id, ip in ip_list:
                ip_dict[ip] = (ip_id, address_id, ip)

            for task in done:
                connectionId, latencyResult, blockcountResult, versionResult, connectioncountResult,\
                            rawmempoolResult, peersResult, rpcHttpsService, rpcHttpService = task.result()

                if latencyResult!=None:
                    ts, latency = latencyResult
                    latencyData.append( (ts, connectionId, latency))
                    onlineData.append( (ts, connectionId, True))

                    if versionResult!=None:
                        ts, version = versionResult
                        versionData.append( (ts, connectionId, version["result"]['useragent']))
                
                    if blockcountResult!=None:
                        ts, blockcount = blockcountResult
                        blockheightData.append( (ts, connectionId, blockcount["result"]))

                        if blockcount["result"]> maxBlockHeight:
                            maxBlockHeight=blockcount["result"]
                    
                    if connectioncountResult!=None:
                        ts, connectioncount = connectioncountResult
                        connectionscountData.append( (ts, connectionId, connectioncount["result"]))

                    if rawmempoolResult!=None:
                        ts, rawmempool = rawmempoolResult
                        mempoolsizeData.append( (ts, connectionId, len(rawmempool["result"])))

                    if rawmempoolResult!=None and blockcountResult!=None:
                        ts, rawmempool = rawmempoolResult
                        _, blockcount = blockcountResult
                        if len(rawmempool["result"]) > 0 and abs(maxBlockHeight-blockcount["result"])<5:
                            data = []
                            for tx in rawmempool["result"]:
                                mempoolData.append((blockcount["result"], connectionId, tx))
                    if rpcHttpsService!=None:
                        ts, rpcHttps = rpcHttpsService
                        rcpHttpsData.append((ts, connectionId, rpcHttps))
                    
                    if rpcHttpService!=None:
                        ts, rpcHttp = rpcHttpService
                        rcpHttpData.append((ts, connectionId, rpcHttp))

                    if peersResult!=None:
                        ts, peers = peersResult
                        peers = [ i['address'] for i in peers["result"]['connected']]
                        validated_peers=0
                        for connected_peer in peers:
                            if '::ffff:' in connected_peer:
                                peer_address = connected_peer.split('::ffff:')[1]
                            else:
                                peer_address = connected_peer
                            
                            if peer_address.split('.')[0]=="10":
                                continue  
                                                
                            if peer_address not in ip_dict:
                                continue
                            
                            _, validatedPeerAddressId, _ = ip_dict[peer_address]   
                            validatedPeersHistoryData.append((ts, connectionId, validatedPeerAddressId))
                            validated_peers+=1 

                        validatedPeersCountData.append((ts, connectionId, validated_peers))
                else:
                    numTimeout+=1
                    ts = getSqlDateTime(time.time())
                    latencyData.append( (ts, connectionId, 2000))
                    onlineData.append( (ts, connectionId, False))
                

            t0 = time.time()
            conn = psycopg2.connect("dbname='{}' user='{}' host='{}' password='{}'".format(databasename, user, host, password))
            cursor = conn.cursor()

            psycopg2.extras.execute_values(cursor, 
                "INSERT INTO latency_history (ts, connection_id, latency_history) VALUES %s", 
                latencyData 
                )

            psycopg2.extras.execute_values(cursor, 
                "INSERT INTO blockheight_history (ts, connection_id, blockheight) VALUES %s", 
                blockheightData 
                )

            psycopg2.extras.execute_values(cursor, 
                "INSERT INTO online_history (ts, connection_id, online) VALUES %s", 
                onlineData 
                )

            psycopg2.extras.execute_values(cursor, 
                "INSERT INTO version_history (ts, connection_id, version) VALUES %s", 
                versionData)

            psycopg2.extras.execute_values(cursor, 
                "INSERT INTO rpc_http_status_history (ts, connection_id, rpc_http_status) VALUES %s", 
                rcpHttpData)

            psycopg2.extras.execute_values(cursor, 
                "INSERT INTO rpc_https_status_history (ts, connection_id, rpc_https_status) VALUES %s", 
                rcpHttpsData)

            psycopg2.extras.execute_values(cursor, 
                "INSERT INTO validated_peers_history (ts, connection_id, validated_peers_connection_id) VALUES %s",
                validatedPeersHistoryData)

            psycopg2.extras.execute_values(cursor, 
                "INSERT INTO validated_peers_counts_history (ts, connection_id, validated_peers_counts) VALUES %s",
                validatedPeersCountData)

            logger.info("len(mempoolData)", len(mempoolData))
            psycopg2.extras.execute_values(cursor, 
                "INSERT INTO unconfirmed_tx (last_blockheight, connection_id, tx) VALUES %s", 
                mempoolData)

            t1 = time.time()
            logger.info("numTimeout ", numTimeout)
            logger.info('SQL Took %.2f ms' % (1000*(t1-t0)))
        except:
            logger.error("Exception, closing event loop")
            loop.close()