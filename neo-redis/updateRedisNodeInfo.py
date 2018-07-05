import redis
import psycopg2

from config import CONNECTION_STR, DSN
from config import REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_DB,  NAMESPACE
import time
import json


if __name__ == "__main__":
    while True:
        r = redis.StrictRedis(
            host=REDIS_HOST, password=REDIS_PASSWORD, port=REDIS_PORT, db=REDIS_DB)

        connect_str = CONNECTION_STR

        conn = psycopg2.connect(connect_str)

        cursor = conn.cursor()

        cursor.execute("select addr.id, addr.address as hostname, proto.protocol, po.port, coalesce( activep2p.p2p_tcp_status, false ) as p2p_tcp_status, coalesce( activep2pws.p2p_ws_status, false ) as p2p_ws_status, concat( proto.protocol, '://', addr.address, ':' , po.port ) as address, coalesce( vpt.validated_peers_counts, 0 ) as validated_peers_counts, coalesce( stab.stability, 0 ) as stability, coalesce( bhs.blockheight_score* 100, 0 ) as blockheight_score, coalesce( (latency_score)* 100, 0 ) as normalised_latency_score, coalesce( vpt.validated_peers_counts_score * 100, 0 ) as validated_peers_counts_score, ( coalesce( vpt.validated_peers_counts_score, 0 ) * 100 + coalesce( stab.stability, 0 ) + coalesce( (latency_score)* 100, 0 ) + coalesce( bhs.blockheight_score, 0 ) * 100 )/ 4.0 as health_score, coalesce( lat.latency, 200 ) as latency, b.rpc_https_status as rpc_https_status, c.rpc_http_status as rpc_http_status, coalesce( d.mempool_size, 0 ) as mempool_size, coalesce( e.connection_counts, 0 ) as connection_counts, f.online, coalesce( g.blockheight, 0 ) as blockheight, co.lat, co.long, lo.locale, version, max_blockheight.max_blockheight from address addr inner join coordinates co on addr.id = co.address_id inner join locale lo on addr.id = lo.address_id inner join port po on addr.id = po.address_id inner join protocol proto on addr.id = proto.address_id left join ( select address_id, p2p_tcp_status from p2p_tcp_status_history where ts = ( select max( ts ) from p2p_tcp_status_history ) ) activep2p on activep2p.address_id = addr.id left join ( select address_id, p2p_ws_status from p2p_ws_status_history where ts = ( select max( ts ) from p2p_ws_status_history ) ) activep2pws on activep2pws.address_id = addr.id left join ( select address_id, ( case when ( ( max_blockheight - blockheight ) < 50 ) then coalesce( 1 - ( ( max_blockheight + 0.0 ) - blockheight )/ 50, 0 ) else 0 end ) as blockheight_score, max_blockheight from ( select t.address_id, coalesce( m.blockheight, 0 ) as blockheight from ( select address_id, max( ts ) as ts from blockheight_history group by address_id ) t join blockheight_history m on m.address_id = t.address_id and t.ts = m.ts ) temp cross join ( select max( m.blockheight ) as max_blockheight from ( select blo_h.address_id, max( blo_h.ts ) as ts from blockheight_history blo_h group by address_id ) t join blockheight_history m on m.address_id = t.address_id and t.ts = m.ts ) sub2 ) bhs on bhs.address_id = addr.id left join ( select z.address_id, sum( case when online = true then 1 else 0 end ) as stability from ( select *, row_number() over ( partition by address_id order by id desc ) from online_history ) z where z.row_number <= 100 group by z.address_id ) as stab on stab.address_id = addr.id left join ( select address_id, latency_threshold, max_latency, latency, 1 - ( latency_threshold / 2 ) as latency_score from ( select t.address_id, case when ( latency_history < 2 ) then latency_history else 2 end as latency_threshold, m.latency_history as latency, max_latency from ( select lat_h.address_id, max( lat_h.ts ) as mx from latency_history lat_h group by lat_h.address_id ) t join latency_history m on m.address_id = t.address_id and t.mx = m.ts cross join ( select max( latency_history ) as max_latency from latency_history ) max_latency_table ) latency_threshold_table ) as lat on lat.address_id = addr.id left join ( select address_id, coalesce( rpc_https_status, false ) as rpc_https_status from ( select address_id, ts, rpc_https_status from rpc_https_status_history where ( address_id, ts ) in ( select address_id, max( ts ) as ts from rpc_https_status_history group by address_id ) ) temp ) b on b.address_id = addr.id left join ( select address_id, coalesce( rpc_http_status, false ) as rpc_http_status from ( select address_id, ts, rpc_http_status from rpc_http_status_history where ( address_id, ts ) in ( select address_id, max( ts ) as ts from rpc_http_status_history group by address_id ) ) temp ) c on c.address_id = addr.id left join ( select address_id, coalesce( mempool_size, 0 ) as mempool_size from ( select t.address_id, mempool_size from ( select address_id, max( ts ) as ts from mempool_size_history group by address_id ) t join mempool_size_history m on m.address_id = t.address_id and t.ts = m.ts ) temp ) d on d.address_id = addr.id left join ( select address_id, coalesce( connection_counts, 0 ) as connection_counts from ( select t.address_id, connection_counts from ( select address_id, max( ts ) as ts from connection_counts_history group by address_id ) t join connection_counts_history m on m.address_id = t.address_id and t.ts = m.ts ) temp ) e on e.address_id = addr.id left join ( select address_id, coalesce( online, false ) as online from ( select address_id, ts, online from online_history where ( address_id, ts ) in ( select address_id, max( ts ) as ts from online_history group by address_id ) ) temp ) f on f.address_id = addr.id left join ( select t.address_id, blockheight from ( select address_id, max( ts ) as ts from blockheight_history group by address_id ) t join blockheight_history m on m.address_id = t.address_id and t.ts = m.ts ) g on g.address_id = addr.id left join ( select address_id, coalesce( validated_peers_counts, 0 ) as validated_peers_counts, coalesce( validated_peers_counts*1.0 / max, 0 ) as validated_peers_counts_score from ( select t.address_id, validated_peers_counts from ( select address_id, max( ts ) as ts from validated_peers_counts_history group by address_id ) t join validated_peers_counts_history m on m.address_id = t.address_id and t.ts = m.ts ) sub1 cross join ( select max( validated_peers_counts ) from ( select t.address_id, validated_peers_counts from ( select address_id, max( ts ) as ts from validated_peers_counts_history group by address_id ) t join validated_peers_counts_history m on m.address_id = t.address_id and t.ts = m.ts ) sub2 ) sub3 ) vpt on vpt.address_id = addr.id left join ( select address_id, coalesce( version, null ) as version from ( select t.address_id, version from ( select address_id, max( ts ) as ts from version_history group by address_id ) t join version_history m on m.address_id = t.address_id and t.ts = m.ts ) temp ) v on v.address_id = addr.id cross join ( select max( blockheight ) as max_blockheight from blockheight_history where blockheight is not null ) max_blockheight order by health_score desc")

        nodes = []
        result = cursor.fetchall()

        for node_info in result:
            print(node_info)
            node = {"id": node_info[0],
                    "hostname": node_info[1],
                    "protocol": node_info[2],
                    "port": node_info[3],
                    "p2p_tcp_status": node_info[4],
                    "p2p_ws_status": node_info[5],
                    "address": node_info[6],
                    "validated_peers_counts": node_info[7],
                    "stability": node_info[8],
                    "blockheight_score": float(node_info[9]),
                    "normalised_latency_score": node_info[10],
                    "validated_peers_counts_score": float(node_info[11]),
                    "health_score": node_info[12],
                    "latency": node_info[13],
                    "rcp_https_status": node_info[14],
                    "rcp_http_status": node_info[15],
                    "mempool_size": node_info[16],
                    "connection_counts": node_info[17],
                    "online": node_info[18],
                    "blockheight": node_info[19],
                    "lat": node_info[20],
                    "long": node_info[21],
                    "locale": node_info[22],
                    "version": node_info[23],
                    "max_blockheight": node_info[24]}
            nodes.append(node)

        for node in nodes:
            r.hset(NAMESPACE + 'node', node["id"], json.dumps(node))
        time.sleep(60)
