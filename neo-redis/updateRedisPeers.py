import redis
import psycopg2
import time

from config import CONNECTION_STR, DSN
from config import REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_DB, NAMESPACE

import json

if __name__ == "__main__":
    while True:
        r = redis.StrictRedis(
            host=REDIS_HOST, password=REDIS_PASSWORD, port=REDIS_PORT, db=REDIS_DB)
        
        connect_str = CONNECTION_STR

        conn = psycopg2.connect(connect_str)

        cursor = conn.cursor()

        cursor.execute("select updated_peers_table.address_id, updated_peers_table.validated_peers_address_id, addr.address as validated_peers_address, proto.protocol as validated_peers_protocol, po.port as validated_peers_port, CONCAT(proto.protocol, '://', addr.address, ':', po.port) as validated_peers_fulladdress from (select vh.address_id, vh.validated_peers_address_id from validated_peers_history vh where (vh.address_id, vh.ts) in (select vh.address_id, max(vh.ts ) as maxts from validated_peers_history vh group by vh.address_id)) updated_peers_table left join address addr on addr.id = updated_peers_table.validated_peers_address_id left join protocol proto on proto.address_id = updated_peers_table.validated_peers_address_id left join port po on po.address_id = updated_peers_table.validated_peers_address_id")
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
            r.hset('validatedpeers', node_key, json.dumps(node_peers))

        cursor.execute("select max_ts_validated_peers_table.address_id as source_address_id, concat( protob.protocol, '://', address_b.address ) as source_address, validated_peers_address_Id, concat( protoa.protocol, '://', address_a.address ) validated_peers_address from ( select address_id, ts, validated_peers_address_Id from validated_peers_history where ( address_id, ts ) in ( select address_id, max(ts) from validated_peers_history group by address_id ) ) max_ts_validated_peers_table inner join address address_a on address_a.id = max_ts_validated_peers_table.validated_peers_address_Id inner join address address_b on address_b.id = max_ts_validated_peers_table.address_Id inner join protocol protoa on protoa.address_id = address_a.id inner join protocol protob on protob.address_id = address_b.id")
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

        r.set(NAMESPACE+"edges", json.dumps(edges))

        cursor.execute("select adr.id, address as hostname, protocol, CONCAT(proto.protocol, '://', adr.address) as address from address adr inner join protocol proto on adr.id = proto.address_id")
        result = cursor.fetchall()

        nodeslist = []
        for node in result:
            node_format = {"id":node[0],
            "hostname":node[1],
            "protocol":node[2],
            "address":node[3]}
            nodeslist.append(node_format)

        r.set(NAMESPACE+"nodeslist", json.dumps(nodeslist))
        time.sleep(60)






