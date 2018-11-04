import redis
import psycopg2
import time
import json
import os
import logging

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(
    databasename, user, host, password)

redisHost = str(os.environ['REDIS_HOST'])
redisPort = str(os.environ['REDIS_PORT'])
redisDb = str(os.environ['REDIS_DB'])
redisNamespace = str(os.environ['REDIS_NAMESPACE'])
if "REDIS_PASS" in os.environ:
    redisPass = str(os.environ['REDIS_PASS'])

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

VALIDATED_PEERS_SQL = """select
                            updated_peers_table.connection_id,
                            updated_peers_table.validated_peers_connection_id,
                            n.hostname as validated_peers_address,
                            ce.protocol as validated_peers_protocol,
                            ce.port as validated_peers_port,
                            concat( ce.protocol, '://', n.hostname, ':', ce.port ) as validated_peers_fulladdress
                        from
                            (
                                select
                                    vh.connection_id,
                                    vh.validated_peers_connection_id
                                from
                                    validated_peers_history vh
                                where
                                    (
                                        vh.connection_id,
                                        vh.ts
                                    ) in (
                                        select
                                            vh.connection_id,
                                            max(vh.ts) as maxts
                                        from
                                            validated_peers_history vh
                                        group by
                                            vh.connection_id
                                    )
                            ) updated_peers_table
                        left join connection_endpoints ce on
                            ce.id = updated_peers_table.validated_peers_connection_id
                        left join nodes n on
                            ce.node_id = n.id"""

EDGES_SQL = """select
                            max_ts_validated_peers_table.connection_id as source_connection_id,
                            concat( endpoint_b.protocol, '://', node_b.hostname ) as source_address,
                            validated_peers_connection_id,
                            concat( endpoint_a.protocol, '://', node_a.hostname ) validated_peers_address
                        from
                            (
                                select
                                    connection_id,
                                    ts,
                                    validated_peers_connection_id
                                from
                                    validated_peers_history
                                where
                                    (
                                        connection_id,
                                        ts
                                    ) in (
                                        select
                                            connection_id,
                                            max(ts)
                                        from
                                            validated_peers_history
                                        group by
                                            connection_id
                                    )
                            ) max_ts_validated_peers_table
                        inner join connection_endpoints endpoint_a on
                            endpoint_a.id = max_ts_validated_peers_table.validated_peers_connection_id
                        inner join connection_endpoints endpoint_b on
                            endpoint_b.id = max_ts_validated_peers_table.connection_id
                        inner join nodes node_a on
                            node_a.id = endpoint_a.node_id
                        inner join nodes node_b on
                            node_b.id = endpoint_b.node_id"""

NODES_LIST_SQL = """select
                            endpoint.id ,
                            n.hostname,
                            endpoint.protocol,
                            concat( endpoint.protocol, '://', n.hostname ) as address
                        from
                            connection_endpoints endpoint
                        inner join nodes n on
                            n.id = endpoint.node_id"""

SEEP_TIME = 60
if __name__ == "__main__":
    while True:
        r=None
        if "REDIS_PASS" in os.environ:
            # Testing locally
            r = redis.StrictRedis(
                host=redisHost, port=redisPort, db=redisDb, 
                password=redisPass)
        else:
            r = redis.StrictRedis(
                host=redisHost, port=redisPort, db=redisDb)

        conn = psycopg2.connect(connection_str)

        cursor = conn.cursor()

        t0 = time.time()
        cursor.execute(VALIDATED_PEERS_SQL)
        result = cursor.fetchall()

        peers_table={}

        for peer in result:
            peer_info = { "address_id": peer[1],
                "hostname": peer[2],
                "protocol": peer[3],
                "port": peer[4],
                "address": peer[5]}

            if peer[0] in peers_table:
                peers_table[peer[0]].append(peer_info)
            else:
                peers_table[peer[0]] = [peer_info]

        for node_key in peers_table:
            node_peers = peers_table[node_key]
            r.hset(redisNamespace+'validatedpeers', node_key, json.dumps(node_peers))

        t1 = time.time()
        logger.info('{} Took {} ms'.format(redisNamespace+'validatedpeers', 
            (1000*(t1-t0))))

        t0 = time.time()
        cursor.execute(EDGES_SQL)
        result = cursor.fetchall()

        edges = []

        for edge in result:
            edge_format = {
                "source_address_id":edge[0],
                "source_address":edge[1],
                "validated_peers_address_id":edge[2],
                "validated_peers_address":edge[3]
            }
            edges.append(edge_format)

        r.set(redisNamespace+"edges", json.dumps(edges))

        t1 = time.time()
        logger.info('{} Took {} ms'.format(redisNamespace+'edges', 
            (1000*(t1-t0))))

        t0 = time.time()
        cursor.execute(NODES_LIST_SQL)
        result = cursor.fetchall()

        nodeslist = []
        for node in result:
            node_format = {"id":node[0],
            "hostname":node[1],
            "protocol":node[2],
            "address":node[3]}
            nodeslist.append(node_format)

        r.set(redisNamespace+"nodeslist", json.dumps(nodeslist))
        t1 = time.time()
        logger.info('{} Took {} ms'.format(redisNamespace+'nodeslist', 
            (1000*(t1-t0))))

        time.sleep(SEEP_TIME)

