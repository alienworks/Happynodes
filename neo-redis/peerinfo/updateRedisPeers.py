import redis
import psycopg2
import time

import json
import os

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(databasename, user, host, password)

redisHost = str(os.environ['REDIS_HOST'])
redisPort = str(os.environ['REDIS_PORT'])
redisDb = str(os.environ['REDIS_DB'])
redisNamespace = str(os.environ['REDIS_NAMESPACE'])


if __name__ == "__main__":
    while True:
        r = redis.StrictRedis(
            host=redisHost, port=redisPort, db=redisDb)

        conn = psycopg2.connect(connection_str)

        cursor = conn.cursor()

        cursor.execute("""select
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
                            ce.node_id = n.id""")
        result = cursor.fetchall()
        print(result)

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

        cursor.execute("""select
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
                                            max( ts )
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
                            node_b.id = endpoint_b.node_id""")
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

        cursor.execute("""select
                            endpoint.id ,
                            n.hostname,
                            endpoint.protocol,
                            concat( endpoint.protocol, '://', n.hostname ) as address
                        from
                            connection_endpoints endpoint
                        inner join nodes n on
                            n.id = endpoint.node_id""")
        result = cursor.fetchall()

        nodeslist = []
        for node in result:
            node_format = {"id":node[0],
            "hostname":node[1],
            "protocol":node[2],
            "address":node[3]}
            nodeslist.append(node_format)

        r.set(redisNamespace+"nodeslist", json.dumps(nodeslist))
        time.sleep(60)






