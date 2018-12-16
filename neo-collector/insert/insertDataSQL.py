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
import statistics
from datetime import timezone
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
MAX_CON = 100
tcp = ThreadedConnectionPool(MIN_CON, MAX_CON, dsn)

last_max_blockheight_ts = -1
maxBlockHeight = -1

GET_ENDPOINTS_SQL="""SELECT endpoint.id, 
                    concat(endpoint.protocol, '://', n.hostname,':' , endpoint.port) AS url 
                    FROM connection_endpoints endpoint  
                    INNER JOIN nodes n  
                    ON n.id=endpoint.node_id""" 

GET_ENDPOINTS_IP_SQL = """select n.id,ce.id,ip 
                    from connection_endpoints ce 
                    inner join nodes n 
                    on n.id=ce.node_id"""

INSERT_LATENCY_SQL = "INSERT INTO latency_history (ts, connection_id, latency_history) VALUES %s"
INSERT_BLOCKHEIGHT_SQL = "INSERT INTO blockheight_history (ts, connection_id, blockheight) VALUES %s"
INSERT_ONLINE_SQL = "INSERT INTO online_history (ts, connection_id, online) VALUES %s"
INSERT_VERSION_SQL = "INSERT INTO version_history (ts, connection_id, version) VALUES %s"
INSERT_RPC_HTTP_SQL =  "INSERT INTO rpc_http_status_history (ts, connection_id, rpc_http_status) VALUES %s"
INSERT_RPC_HTTPS_SQL = "INSERT INTO rpc_https_status_history (ts, connection_id, rpc_https_status) VALUES %s"
INSERT_PEERS_SQL = "INSERT INTO validated_peers_history (ts, connection_id, validated_peers_connection_id) VALUES %s"
INSERT_PEERS_COUNT_SQL = "INSERT INTO validated_peers_counts_history (ts, connection_id, validated_peers_counts) VALUES %s"
INSERT_UNCONFIRMED_TX_SQL =  "INSERT INTO unconfirmed_tx (last_blockheight, connection_id, tx) VALUES %s"
INSERT_MEMPOOL_SIZE_SQL =  "INSERT INTO mempool_size_history (ts, connection_id, mempool_size) VALUES %s"
INSERT_CONNECTIONS_COUNT_SIZE_SQL = "INSERT INTO connection_counts_history (ts, connection_id, connection_counts) VALUES %s"


def getSqlDateTime(ts):
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')

async def callEndpoint(url, method, params=None):
    if params==None:
        params=[]
    timeout = aiohttp.ClientTimeout(total=3)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json={'jsonrpc': '2.0', 'method': method, 'params': params, 'id': 1}
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
    url = url[:-5] + str(port)
    timeout = aiohttp.ClientTimeout(total=1)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json={'jsonrpc': '2.0', 'method': 'getblockcount', 'params': [], 'id': 1}
                , timeout=timeout) as response:
                status_code = response.status
                portOkay = status_code >=200 or status_code<300
                ts = getSqlDateTime(time.time())
                logger.info ("url:{} port:{} rpc port looks good".format(url, port))
                return ts, portOkay
        except (aiohttp.InvalidURL, aiohttp.ClientConnectorError, asyncio.TimeoutError) as e:
            logger.info ("url:{} port:{} rpc port times out".format(url, port))
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
    max_block_result = None
    latencyResult = await getLatency(url)
    if latencyResult != None:
        blockcountResult = await callEndpoint(url, 'getblockcount')
        if maxBlockHeight == -1:
            max_block_result = await callEndpoint(url, 'getblock', params=[10000, 1])
        else:
            max_block_result = await callEndpoint(url, 'getblock', params=[maxBlockHeight+1, 1])
        versionResult = await callEndpoint(url, 'getversion')
        validators_result = await callEndpoint(url, 'getvalidators')
        connectioncountResult = await callEndpoint(url, 'getconnectioncount')
        rawmempoolResult = await callEndpoint(url, 'getrawmempool')
        peersResult = await callEndpoint(url, 'getpeers')
        rpc_https_service = await testPort( url, JSON_RPC_HTTPS_PORT)
        rpc_http_service = await testPort( url, JSON_RPC_HTTP_PORT)

        wallet_status = await callEndpoint(url, 'listaddress')

        logger.info( "{} done".format(url))

        return connectionId, latencyResult, blockcountResult, versionResult, connectioncountResult,\
                rawmempoolResult, peersResult, rpc_https_service, rpc_http_service, wallet_status, max_block_result, validators_result
    else:
        logger.info( "{} done".format(url))
        return connectionId, latencyResult, None, None, None, None, None, None, None, None, None, None
    

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
    mempoolsizeData = []
    mempoolData = []
    connectionscountData = []
    onlineData = []
    versionData = []
    rcpHttpData = []
    rcpHttpsData = []

    validatedPeersHistoryData = []
    validatedPeersCountData = []

    wallet_status_data = []
    max_block_result_data = []
    validators_result_data= []

    numTimeout=0
    
    global maxBlockHeight

    for task in done:
        connectionId, latencyResult, blockcountResult, versionResult, connectioncountResult,\
                    rawmempoolResult, peersResult, rpcHttpsService, rpcHttpService, wallet_status, max_block_result, validators_result = task.result()

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

            if max_block_result!= None:
                ts, max_block_info = max_block_result
                max_block_result_data.append((ts, max_block_info["result"]))
            
            if connectioncountResult!=None:
                ts, connectioncount = connectioncountResult
                connectionscountData.append( (ts, connectionId, connectioncount["result"]))

            if validators_result!=None:
                ts, validators = validators_result
                validators_result_data.append( (ts, validators["result"]) )

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

            if wallet_status!=None:
                ts, _ = wallet_status
                wallet_status_data.append((ts, connectionId, True))
            else:
                ts = getSqlDateTime(time.time())
                wallet_status_data.append((ts, connectionId, False))

            if peersResult!=None:
                ts, peers = peersResult
                peers = [ i['address'] for i in (peers["result"]['connected'])]
                peers = list(set(peers))
                validated_peers=0
                for connected_peer in peers:
                    if '::ffff:' in connected_peer:
                        peer_address = connected_peer.split('::ffff:')[1]
                    else:
                        peer_address = connected_peer
                    
                    if peer_address.split('.')[0]=="10":
                        continue  
                                        
                    if peer_address not in ipToEndpointMap:
                        continue
                    
                    _, validatedPeerAddressId, _ = ipToEndpointMap[peer_address]   
                    validatedPeersHistoryData.append((ts, connectionId, validatedPeerAddressId))
                    validated_peers+=1 

                validatedPeersCountData.append((ts, connectionId, validated_peers))
        else:
            numTimeout = numTimeout + 1
            ts = getSqlDateTime(time.time())
            latencyData.append((ts, connectionId, 2))
            onlineData.append((ts, connectionId, False))
            wallet_status_data.append((ts, connectionId, False))

    logger.info("numTimeout {}".format(numTimeout))
    return latencyData, blockheightData, mempoolsizeData, mempoolData, connectionscountData, onlineData\
        , versionData, rcpHttpData, rcpHttpsData, validatedPeersHistoryData, validatedPeersCountData, wallet_status_data, max_block_result_data, validators_result_data

def batchInsert(cursor, sqlScript, datalist):
    psycopg2.extras.execute_values(cursor, sqlScript,datalist)

def insertRedisBlockInfo(max_block_result_data):
    if len(max_block_result_data)!=0:
        r = get_redis_instance()
        ts, max_block_result = max_block_result_data[0]

        r.set(redisNamespace+'lastestblock', max_block_result['index'])
        r.set(redisNamespace+'lastestblocksize', max_block_result['size'])
        r.set(redisNamespace+'lastesttxcount', len(max_block_result['tx']))
        r.set(redisNamespace+'lastestblocktime', max_block_result['time'])

    else:
        logger.info("nothing in the list motherfucker")

def insertRedisValidators(validators_result_data):
    r = get_redis_instance()
    ts, validators = validators_result_data[0]
    r.set(redisNamespace+'validators', validators)

def insertRedisBlockheight(blockheightData):
    global last_max_blockheight_ts
    max_blockheight = -1
    max_blockheight_ts = -1
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
        if blockcount > max_blockheight:
            max_blockheight = blockcount
            max_blockheight_ts = ts
        if result!=None:
            node_info=json.loads(result)
            node_info["blockheight"] = blockcount
            # node_info["last_update_time"] = ts
            r.hset(redisNamespace + 'node', connectionId, json.dumps(node_info))

    if last_max_blockheight_ts != -1:
        a = datetime.datetime.strptime(max_blockheight_ts, '%Y-%m-%d %H:%M:%S')
        r.set(redisNamespace+'lastblock', 
            a.replace(tzinfo=timezone.utc).timestamp())
        
    last_max_blockheight_ts = max_blockheight_ts
    r.set(redisNamespace+'bestblock', max_blockheight)
    t1 = time.time()
    logger.info('Redis Took %.2f ms' % (1000*(t1-t0)))

def insertRedisUnconfirmedTxCount(mempoolsizeData):
    t0 = time.time()
    if "REDIS_PASS" in os.environ:
        # Testing locally
        r = redis.StrictRedis(
            host=redisHost, port=redisPort, db=redisDb, 
            password=redisPass)
    else:
        r = redis.StrictRedis(
            host=redisHost, port=redisPort, db=redisDb)

    for (ts, connectionId, mempoolsize) in mempoolsizeData:
        result = r.hget(redisNamespace + 'node', connectionId)
        if result!=None:
            node_info=json.loads(result)
            node_info["mempool_size"] = mempoolsize
            r.hset(redisNamespace + 'node', connectionId, json.dumps(node_info))
    t1 = time.time()
    logger.info('insertRedisUnconfirmedTxCount Redis Took %.2f ms' % (1000*(t1-t0)))


def get_redis_instance():
    if "REDIS_PASS" in os.environ:
        # Testing locally
        r = redis.StrictRedis(
            host=redisHost, port=redisPort, db=redisDb, 
            password=redisPass)
    else:
        r = redis.StrictRedis(
            host=redisHost, port=redisPort, db=redisDb)
    return r


def insertRedisWalletStatus(wallet_status_data):
    r = get_redis_instance()

    for ts, connectionId, wallet_status in wallet_status_data:
        result = r.hget(redisNamespace + 'node', connectionId)
        if result!=None:
            node_info=json.loads(result)
            node_info["wallet_status"] = wallet_status
            r.hset(redisNamespace + 'node', connectionId, json.dumps(node_info))

def insertRedisLatency(latencyData):
    logger.info("latencyData {}".format(latencyData))
    r = get_redis_instance()
    for ts, connectionId, latency in latencyData:
        result = r.hget(redisNamespace + 'node', connectionId)
        if result==None:
            return
        else:
            node_info=json.loads(result)
            list_latency = node_info.get("list_of_latency", [])
            list_latency.append(latency)
            if len(list_latency) > 200:
                list_latency.pop()
            node_info["list_of_latency"] = list_latency
            node_info["average_latency"] = statistics.median(list_latency)
            r.hset(redisNamespace + 'node', connectionId, json.dumps(node_info))
            logger.info("inserting latency for connectionId {}".format(connectionId))


def updateSql(latencyData, blockheightData, mempoolsizeData, mempoolData, connectionscountData, onlineData\
            , versionData, rcpHttpData, rcpHttpsData, validatedPeersHistoryData, validatedPeersCountData, wallet_status_data, max_block_result_data, validators_result_data):
    t0 = time.time()

    conn = tcp.getconn(key="same")
    cursor = conn.cursor()

    insertRedisValidators(validators_result_data)
    
    batchInsert(cursor, INSERT_LATENCY_SQL, latencyData)
    insertRedisLatency(latencyData)
    
    batchInsert(cursor, INSERT_BLOCKHEIGHT_SQL, blockheightData)
    insertRedisBlockheight(blockheightData)

    insertRedisBlockInfo(max_block_result_data)

    batchInsert(cursor, INSERT_ONLINE_SQL, onlineData)

    batchInsert(cursor, INSERT_MEMPOOL_SIZE_SQL, mempoolsizeData)
    insertRedisUnconfirmedTxCount(mempoolsizeData)

    batchInsert(cursor, INSERT_VERSION_SQL, versionData)

    batchInsert(cursor, INSERT_RPC_HTTP_SQL, rcpHttpData)

    batchInsert(cursor, INSERT_RPC_HTTPS_SQL, rcpHttpsData)

    batchInsert(cursor, INSERT_PEERS_SQL, validatedPeersHistoryData)

    batchInsert(cursor, INSERT_PEERS_COUNT_SQL, validatedPeersCountData)

    batchInsert(cursor, INSERT_CONNECTIONS_COUNT_SIZE_SQL, connectionscountData)

    insertRedisWalletStatus(wallet_status_data)

    conn.commit()
    tcp.putconn(conn, key="same")

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

            latencyData, blockheightData, mempoolsizeData, mempoolData, connectionscountData, onlineData\
            , versionData, rcpHttpData, rcpHttpsData, validatedPeersHistoryData, validatedPeersCountData, wallet_status_data, max_block_result_data, validators_result_data = prepareSqlInsert(done, ipToEndpointMap)

            updateSql(latencyData, blockheightData, mempoolsizeData, mempoolData, connectionscountData, onlineData\
                , versionData, rcpHttpData, rcpHttpsData, validatedPeersHistoryData, validatedPeersCountData, wallet_status_data, max_block_result_data, validators_result_data)
        except Exception as e:
            logger.error(e)
            logger.error(traceback.format_exc())

        t1 = time.time()
        logger.info('Total Took %.2f ms' % (1000*(t1-t0)))

    logger.error("Exception, closing event loop")
    loop.close()

if __name__ == "__main__":
    updateApp()