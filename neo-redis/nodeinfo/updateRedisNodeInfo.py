import redis
import psycopg2

import time

import os
import json


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

if __name__ == "__main__":
    while True:
        r = redis.StrictRedis(host=redisHost, port=redisPort, db=redisDb)
        conn = psycopg2.connect(connection_str)
        cursor = conn.cursor()
        cursor.execute("""select
endpoints.id,
n.hostname,
endpoints.protocol,
endpoints.port,
coalesce(
	activep2p.p2p_tcp_status,
	false
) as p2p_tcp_status,
coalesce(
	activep2pws.p2p_ws_status,
	false
) as p2p_ws_status,
concat( endpoints.protocol, '://', n.hostname, ':' , endpoints.port ) as address,
coalesce(
	vpt.validated_peers_counts,
	0
) as validated_peers_counts,
coalesce(
	stab.stability,
	0
) as stability,
coalesce(
	bhs.blockheight_score* 100,
	0
) as blockheight_score,
coalesce(
	(latency_score)* 100,
	0
) as normalised_latency_score,
coalesce(
	vpt.validated_peers_counts_score * 100,
	0
) as validated_peers_counts_score,
(
	coalesce(
		vpt.validated_peers_counts_score,
		0
	) * 100 + coalesce(
		stab.stability,
		0
	) + coalesce(
		(latency_score)* 100,
		0
	) + coalesce(
		bhs.blockheight_score,
		0
	) * 100
)/ 4.0 as health_score,
coalesce(
	lat.latency* 1000,
	200
) as latency,
b.rpc_https_status as rpc_https_status,
c.rpc_http_status as rpc_http_status,
coalesce(
	d.mempool_size,
	0
) as mempool_size,
coalesce(
	e.connection_counts,
	0
) as connection_counts,
f.online,
coalesce(
	g.blockheight,
	0
) as blockheight,
co.lat,
co.long,
lo.locale,
version,
max_blockheight.max_blockheight,
coalesce(
	stab_1000.stability_thousand_pings,
	0
) as stability_thousand_pings
from
connection_endpoints endpoints
inner join coordinates co on
endpoints.id = co.connection_id
inner join locale lo on
endpoints.id = lo.connection_id
inner join nodes n on
endpoints.node_id = n.id
left join (
	select
		connection_id,
		p2p_tcp_status
	from
		(select * from p2p_tcp_status_history order by id desc limit 10000) p2p_tcp_status_history
	where
		ts = (
			select
				max(ts)
			from
				(select * from p2p_tcp_status_history order by id desc limit 10000) p2p_tcp_status_history
		)
) activep2p on
activep2p.connection_id = endpoints.id
left join (
	select
		connection_id,
		p2p_ws_status
	from
		(select * from p2p_ws_status_history order by id desc limit 10000) p2p_ws_status_history
	where
		ts = (
			select
				max(ts)
			from
				(select * from p2p_ws_status_history order by id desc limit 10000) p2p_ws_status_history
		)
) activep2pws on
activep2pws.connection_id = endpoints.id
left join (
	select
		connection_id,
		(
			case
				when (
					(
						max_blockheight - blockheight
					) < 50
				) then coalesce(
					1 - (
						(
							max_blockheight + 0.0
						) - blockheight
					)/ 50,
					0
				)
				else 0
			end
		) as blockheight_score,
		max_blockheight,
		blockheight
	from
		(
			select
				t.connection_id,
				coalesce(
					m.blockheight,
					0
				) as blockheight
			from
				(
					select
						connection_id,
						max(ts) as ts
					from
						(
							select
								*
							from
								blockheight_history
							order by
								id desc limit 100000
						) bh
					group by
						connection_id
				) t
			join (
					select
						*
					from
						blockheight_history
					order by
						id desc limit 100000
				) m on
				m.connection_id = t.connection_id
				and t.ts = m.ts
		) temp cross
	join (
			select
				max(m.blockheight) as max_blockheight
			from
				(
					select
						*
					from
						blockheight_history
					order by
						id desc limit 100000
				) m
		) sub2
) bhs on
bhs.connection_id = endpoints.id
left join (
	select
		z.connection_id,
		sum( case when online = true then 1 else 0 end ) as stability
	from
		(
			select
				*,
				row_number() over (
					partition by connection_id
				order by
					id desc
				)
			from
				(
					select
						*
					from
						online_history
					order by
						id desc limit 100000
				) online_history
		) z
	where
		z.row_number <= 100
	group by
		z.connection_id
) as stab on
stab.connection_id = endpoints.id
left join (
	select
		z.connection_id,
		sum( case when online = true then 1 else 0 end ) as stability_thousand_pings
	from
		(
			select
				*,
				row_number() over (
					partition by connection_id
				order by
					id desc
				)
			from
				(
					select
						*
					from
						online_history
					order by
						id desc limit 100000
				) online_history
		) z
	where
		z.row_number <= 1000
	group by
		z.connection_id
) as stab_1000 on
stab_1000.connection_id = endpoints.id
left join (
	select
		connection_id,
		latency_threshold,
		max_latency,
		latency,
		1 - (
			latency_threshold / 2
		) as latency_score
	from
		(
			select
				t.connection_id,
				case
					when (
						latency_history < 2
					) then latency_history
					else 2
				end as latency_threshold,
				m.latency_history as latency,
				max_latency
			from
				(
					select
						lat_h.connection_id,
						max( lat_h.ts ) as mx
					from
						(
							select
								*
							from
								latency_history
							order by
								id desc limit 1000
						) lat_h
					group by
						lat_h.connection_id
				) t
			join latency_history m on
				m.connection_id = t.connection_id
				and t.mx = m.ts cross
			join (
					select
						max( latency_history ) as max_latency
					from
						(
							select
								*
							from
								latency_history
							order by
								id desc limit 1000
						) latency_history
				) max_latency_table
		) latency_threshold_table
) as lat on
lat.connection_id = endpoints.id
left join (
	select
		connection_id,
		coalesce(
			rpc_https_status,
			false
		) as rpc_https_status
	from
		(
			select
				connection_id,
				ts,
				rpc_https_status
			from
				(
					select
						*
					from
						rpc_https_status_history
					order by
						id desc limit 1000
				) rpc_https_status_history
			where
				(
					connection_id,
					ts
				) in (
					select
						connection_id,
						max(ts) as ts
					from
						(
							select
								*
							from
								rpc_https_status_history
							order by
								id desc limit 1000
						) rpc_https_status_history
					group by
						connection_id
				)
		) temp
) b on
b.connection_id = endpoints.id
left join (
	select
		connection_id,
		coalesce(
			rpc_http_status,
			false
		) as rpc_http_status
	from
		(
			select
				connection_id,
				ts,
				rpc_http_status
			from
				(
					select
						*
					from
						rpc_http_status_history
					order by
						id desc limit 1000
				) rpc_http_status_history
			where
				(
					connection_id,
					ts
				) in (
					select
						connection_id,
						max(ts) as ts
					from
						(
							select
								*
							from
								rpc_http_status_history
							order by
								id desc limit 1000
						) rpc_http_status_history
					group by
						connection_id
				)
		) temp
) c on
c.connection_id = endpoints.id
left join (
	select
		connection_id,
		coalesce(
			mempool_size,
			0
		) as mempool_size
	from
		(
			select
				t.connection_id,
				mempool_size
			from
				(
					select
						connection_id,
						max(ts) as ts
					from
						(
							select
								*
							from
								mempool_size_history
							order by
								id desc limit 1000
						) mempool_size_history
					group by
						connection_id
				) t
			join (
					select
						*
					from
						mempool_size_history
					order by
						id desc limit 1000
				) m on
				m.connection_id = t.connection_id
				and t.ts = m.ts
		) temp
) d on
d.connection_id = endpoints.id
left join (
	select
		connection_id,
		coalesce(
			connection_counts,
			0
		) as connection_counts
	from
		(
			select
				t.connection_id,
				connection_counts
			from
				(
					select
						connection_id,
						max(ts) as ts
					from
						(
							select
								*
							from
								connection_counts_history
							order by
								id desc limit 1000
						) connection_counts_history
					group by
						connection_id
				) t
			join (
					select
						*
					from
						connection_counts_history
					order by
						id desc limit 1000
				) m on
				m.connection_id = t.connection_id
				and t.ts = m.ts
		) temp
) e on
e.connection_id = endpoints.id
left join (
	select
		connection_id,
		coalesce(
			online,
			false
		) as online
	from
		(
			select
				connection_id,
				ts,
				online
			from
				(
					select
						*
					from
						online_history
					order by
						id desc limit 1000
				) online_history
			where
				(
					connection_id,
					ts
				) in (
					select
						connection_id,
						max(ts) as ts
					from
						(
							select
								*
							from
								online_history
							order by
								id desc limit 1000
						) online_history
					group by
						connection_id
				)
		) temp
) f on
f.connection_id = endpoints.id
left join (
	select
		t.connection_id,
		blockheight
	from
		(
			select
				connection_id,
				max(ts) as ts
			from
				(
					select
						*
					from
						blockheight_history
					order by
						id desc limit 1000
				) blockheight_history
			group by
				connection_id
		) t
	join (
			select
				*
			from
				blockheight_history
			order by
				id desc limit 1000
		) m on
		m.connection_id = t.connection_id
		and t.ts = m.ts
) g on
g.connection_id = endpoints.id
left join (
	select
		connection_id,
		coalesce(
			validated_peers_counts,
			0
		) as validated_peers_counts,
		coalesce(
			validated_peers_counts*1.0 / max,
			0
		) as validated_peers_counts_score
	from
		(
			select
				t.connection_id,
				validated_peers_counts
			from
				(
					select
						connection_id,
						max(ts) as ts
					from
						(
							select
								*
							from
								validated_peers_counts_history
							order by
								id desc limit 100000
						) validated_peers_counts_history
					group by
						connection_id
				) t
			join (
					select
						*
					from
						validated_peers_counts_history
					order by
						id desc limit 100000
				) m on
				m.connection_id = t.connection_id
				and t.ts = m.ts
		) sub1 cross
	join (
			select
				max(validated_peers_counts)
			from
				(
					select
						t.connection_id,
						validated_peers_counts
					from
						(
							select
								connection_id,
								max(ts) as ts
							from
								(
									select
										*
									from
										validated_peers_counts_history
									order by
										id desc limit 100000
								) validated_peers_counts_history
							group by
								connection_id
						) t
					join (
							select
								*
							from
								validated_peers_counts_history
							order by
								id desc limit 100000
						) m on
						m.connection_id = t.connection_id
						and t.ts = m.ts
				) sub2
		) sub3
) vpt on
vpt.connection_id = endpoints.id
left join (
	select
		connection_id,
		coalesce(
			version,
			null
		) as version
	from
		(
			select
				t.connection_id,
				version
			from
				(
					select
						connection_id,
						max(ts) as ts
					from
						(select * from version_history order by id desc limit 1000) version_history
					group by
						connection_id
				) t
			join (select * from version_history order by id desc limit 1000)  m on
				m.connection_id = t.connection_id
				and t.ts = m.ts
		) temp
) v on
v.connection_id = endpoints.id cross
join (
	select
		max(blockheight) as max_blockheight
	from
		(select * from blockheight_history order by id desc limit 1000)  blockheight_history
	where
		blockheight is not null
) max_blockheight
order by
health_score desc""")

        result = cursor.fetchall()
        for node_info in result:
            nodeid = node_info[0]
            redis_node = r.hget(redisNamespace + 'node', nodeid)
            stability_1000= node_info[25]

            blockheight = None
            if(redis_node == None):
                blockheight = node_info[19]
            else:
                redis_node = json.loads(redis_node)
                blockheight = redis_node["blockheight"]

            if stability_1000 != 0:
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
                        # "blockheight": blockheight, will fix this when add redis to neo-collect
						"blockheight": node_info[19],
                        "lat": node_info[20],
                        "long": node_info[21],
                        "locale": node_info[22],
                        "version": node_info[23],
                        "max_blockheight": node_info[24]}
                r.hset(redisNamespace + 'node', nodeid, json.dumps(node))
            else:
                r.hdel(redisNamespace + 'node', nodeid)

    time.sleep(1)
