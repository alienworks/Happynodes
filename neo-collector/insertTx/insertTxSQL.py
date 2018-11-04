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
import datetime
import traceback
import redis
import sys
ssl.match_hostname = lambda cert, hostname: True

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

JSON_RPC_HTTPS_PORT=10331
JSON_RPC_HTTP_PORT=10332

redisHost = str(os.environ['REDIS_HOST'])
redisPort = str(os.environ['REDIS_PORT'])
redisDb = str(os.environ['REDIS_DB'])
redisNamespace = str(os.environ['REDIS_NAMESPACE'])
if "REDIS_PASS" in os.environ:
    redisPass = str(os.environ['REDIS_PASS'])

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

dsn = "postgresql://{}:{}@{}/{}".format(user, password, host, databasename)
MIN_CON = 1
MAX_CON = 800
tcp = ThreadedConnectionPool(MIN_CON, MAX_CON, dsn)

GET_ENDPOINTS_SQL="""SELECT endpoint.id, 
                    concat(endpoint.protocol, '://', n.hostname,':' , endpoint.port) AS url 
                    FROM connection_endpoints endpoint  
                    INNER JOIN nodes n  
                    ON n.id=endpoint.node_id""" 
GET_ENDPOINTS_IP_SQL = """select n.id,ce.id,ip 
                    from connection_endpoints ce 
                    inner join nodes n 
                    on n.id=ce.node_id"""

INSERT_BLOCKHEIGHT_SQL = "INSERT INTO blockheight_history (ts, connection_id, blockheight) VALUES %s"
INSERT_UNCONFIRMED_TX_SQL =  "INSERT INTO unconfirmed_tx (last_blockheight, connection_id, tx) VALUES %s"
INSERT_LATENCY_SQL = "INSERT INTO latency_history (ts, connection_id, latency_history) VALUES %s"

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

                if 'error' in result:
                    return None
                return ts, result
        except (aiohttp.InvalidURL, aiohttp.ClientConnectorError) as e:
            return None
        except (asyncio.TimeoutError) as e:
            logger.error("{} {} Timeout".format(url, method))
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
            logger.error ("{} Bad URL or Bad connection".format(url))
            return None
        except (asyncio.TimeoutError) as e:
            logger.error ("{} latency Timeout".format(url))
            return None

async def updateEndpoint(url, connectionId):
    latencyResult = await getLatency(url)
    if latencyResult != None:
        blockcountResult = await callEndpoint(url, 'getblockcount')
        rawmempoolResult = await callEndpoint(url, 'getrawmempool')

        logger.info( "{} done".format(url))

        return connectionId, latencyResult, blockcountResult, rawmempoolResult
    else:
        logger.info( "{} done".format(url))
        return connectionId, latencyResult, None, None
    

async def main(endpointslist):
    logger.info( "size of endpoints list {} done".format(len(endpointslist)))
    t0 = time.time()
    done, pending = await asyncio.wait([updateEndpoint(url, id) for id, url in endpointslist])

    t1 = time.time()
    logger.info('Asyncio Took %.2f ms' % (1000*(t1-t0)))
    return done

def getEndpointsList(sqlScript):
    conn = tcp.getconn()
    cursor = conn.cursor()
    cursor.execute(sqlScript)
    tcp.putconn(conn)
    return cursor.fetchall()

def getIpToEndpointMap(sqlScript):
    conn = tcp.getconn()
    cursor = conn.cursor()
    cursor.execute(sqlScript)
    ip_list = cursor.fetchall()
    tcp.putconn(conn)
    ipToEndpointMap={}
    for ip_id, address_id, ip in ip_list:
        ipToEndpointMap[ip] = (ip_id, address_id, ip)
    return ipToEndpointMap

def prepareSqlInsert(done, ipToEndpointMap):
    latencyData = []
    blockheightData = []
    mempoolData = []
    
    numTimeout=0
    
    global maxBlockHeight

    for task in done:
        connectionId, latencyResult, blockcountResult, rawmempoolResult= task.result()

        if latencyResult!=None:
            ts, latency = latencyResult
            latencyData.append( (ts, connectionId, latency))

            if blockcountResult!=None:
                ts, blockcount = blockcountResult
                blockheightData.append( (ts, connectionId, blockcount["result"]))

                if blockcount["result"]> maxBlockHeight:
                    maxBlockHeight=blockcount["result"]

            if rawmempoolResult!=None and blockcountResult!=None:
                ts, rawmempool = rawmempoolResult
                _, blockcount = blockcountResult
                if len(rawmempool["result"]) > 0 and abs(maxBlockHeight-blockcount["result"])<5:
                    data = []
                    for tx in rawmempool["result"]:
                        mempoolData.append((blockcount["result"], connectionId, tx))

        else:
            numTimeout = numTimeout + 1
            ts = getSqlDateTime(time.time())
            latencyData.append((ts, connectionId, 2))

    logger.info("numTimeout {}".format(numTimeout))
    return latencyData, blockheightData, mempoolData

def batchInsert(cursor, sqlScript, datalist):
    psycopg2.extras.execute_values(cursor, sqlScript,datalist)

def insertRedisBlockheight(blockheightData):
    t0 = time.time()
    if "REDIS_PASS" in os.environ:
        # Testing locally
        r = redis.StrictRedis(
            host=redisHost, port=redisPort, db=redisDb, 
            password=redisPass)
    else:
        r = redis.StrictRedis(
            host=redisHost, port=redisPort, db=redisDb)

    for (ts, connectionId, blockcount) in blockheightData:
        result = r.hget(redisNamespace + 'node', connectionId)
        if result!=None:
            node_info=json.loads(result)
            node_info["blockheight"] = blockcount
            r.hset(redisNamespace + 'node', connectionId, json.dumps(node_info))
    t1 = time.time()
    logger.info('insertRedisBlockheight Redis Took %.2f ms' % (1000*(t1-t0)))


def updateSql(latencyData, blockheightData, mempoolData):
    t0 = time.time()

    conn = tcp.getconn()
    cursor = conn.cursor()
    
    # batchInsert(cursor, INSERT_LATENCY_SQL, latencyData)
    
    # batchInsert(cursor, INSERT_BLOCKHEIGHT_SQL, blockheightData)
    # insertRedisBlockheight(blockheightData)

    logger.info("len(mempoolData) {}".format(len(mempoolData)) )
    batchInsert(cursor, INSERT_UNCONFIRMED_TX_SQL, mempoolData)

    conn.commit()
    tcp.putconn(conn)

    t1 = time.time()
    logger.info('SQL Took %.2f ms' % (1000*(t1-t0)))

def updateApp():
    endpointsList=getEndpointsList(GET_ENDPOINTS_SQL)
    ipToEndpointMap=getIpToEndpointMap(GET_ENDPOINTS_IP_SQL)
    while True:
        t0 = time.time()
        d = datetime.datetime.utcnow()
        if d.hour==10:
            endpointsList=getEndpointsList(GET_ENDPOINTS_SQL)
            ipToEndpointMap=getIpToEndpointMap(GET_ENDPOINTS_IP_SQL)
        try:
            loop = asyncio.get_event_loop()
            done = loop.run_until_complete(main(endpointsList))

            latencyData, blockheightData, mempoolData = prepareSqlInsert(done, ipToEndpointMap)

            updateSql(latencyData, blockheightData, mempoolData)

        except Exception as e: 
            logger.error("Exception, closing event loop")
            logger.error(e)
            logger.error(traceback.format_exc())

        t1 = time.time()
        logger.info('Total Took %.2f ms' % (1000*(t1-t0)))

    loop.close()

if __name__ == "__main__":
    updateApp()