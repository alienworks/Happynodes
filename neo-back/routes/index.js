var express = require('express');
var router = express.Router();
var apicache = require('apicache');
var axios = require('axios');

const { Pool } = require('pg')

var types = require('pg').types
types.setTypeParser(20, function (val) {
	return parseInt(val)
})

types.setTypeParser(1700, 'text', parseFloat);

let cache = apicache.middleware

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	max: 200,
	idleTimeoutMillis: 3000,
	connectionTimeoutMillis: 3000
})

/* GET home page. */
router.get('/', function (req, res, next) {
	res.json({ title: 'Express' });
});

// Took 154ms
// SELECT max(blockheight)
// FROM  blockheight_history
// WHERE blockheight IS NOT NULL
router.get('/bestblock', cache('1 seconds'), function (req, res, next) {
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query('SELECT max(blockheight)  \
    FROM  blockheight_history  \
    WHERE blockheight IS NOT NULL')
				.catch((error) => {
					client.release();
					console.log(error);
				})
				.then(breakdown => {
					client.release()
					console.log('/bestblock', breakdown.rows);
					res.json({ bestblock: breakdown.rows[0].max });
				})
		})
});

// Took 143ms
// SELECT Min(ts)
// FROM blockheight_history
// WHERE blockheight IN ( SELECT MAX(blockheight)
// FROM blockheight_history );
router.get('/lastblock', cache('1 seconds'), function (req, res, next) {
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query("SELECT EXTRACT(EPOCH FROM Min(ts) AT TIME ZONE 'UTC') as min_ts  \
                          FROM  blockheight_history \
                          WHERE blockheight IN ( SELECT MAX(blockheight) \
                          FROM blockheight_history )")
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					console.log('/lastblock', breakdown.rows);
					res.json({ lastblock: breakdown.rows[0].min_ts });
				})
		})
});

router.get('/unconfirmed', cache('2 seconds'), function (req, res, next) {
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query(`SELECT addr.id as addressid, proto.protocol, addr.address as hostname, po.port, unconfirm_tx_table.node_count, unconfirm_tx_table.tx, unconfirm_tx_table.last_blockheight
				FROM 
				(SELECT max(address_id) AS address_id, count(address_id) AS node_count, tx, max(last_blockheight) AS last_blockheight
				FROM public.unconfirmed_tx 
				WHERE last_blockheight = (SELECT max(blockheight) FROM blockheight_history) 
				GROUP BY tx 
				ORDER BY node_count DESC) unconfirm_tx_table
				INNER JOIN
				address addr
				ON addr.id = unconfirm_tx_table.address_id
				INNER JOIN
				protocol proto
				ON addr.id = proto.address_id
				INNER JOIN
				port po
				ON addr.id = po.address_id`)
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					res.json({ txs: breakdown.rows });
				})
		})
});

router.post('/unconfirmed/tx', cache('2 seconds'), function (req, res, next) {
	let tx = req.body.tx;
	let addressid = req.body.addressid;

	pool.connect()
		.then(client => {
			return client.query(`SELECT CONCAT(proto.protocol, '://',  addr.address, ':', po.port) AS url
			FROM address addr
			INNER JOIN protocol proto
			ON proto.address_id=addr.id
			INNER JOIN port po
			ON po.address_id =addr.id
			WHERE addr.id=$1`, [addressid])
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					let url = breakdown.rows[0].url
					axios.post(url, {
							"jsonrpc": "2.0",
							"method": "getrawtransaction",
							"params": [tx, 1],
							"id": 1
						})
						.then(function (response) {
							console.log(response);
							res.json({ data: response.data });
						})
						.catch(function (error) {
							console.log(error);
							res.json({ error });
						});
				})
		})
});

// select min(A.ts), min(B.ts), (min(A.ts) - min(B.ts)) / 39 as avg
// from blockheight_history A, blockheight_history B
// where A.blockheight in (select max(blockheight)  
//     FROM  blockheight_history  
//     WHERE blockheight IS NOT null)
// and B.blockheight = A.blockheight - 40


// SELECT avg(e.diff)
// FROM 
// (SELECT (C.ts - D.ts) AS diff
// FROM 
// (SELECT blockheight, ts 
// FROM 
// (SELECT blockheight, min(ts) AS ts
// FROM blockheight_history
// WHERE blockheight IS NOT NULL
// GROUP BY blockheight
// ORDER BY ts desc) c
// ORDER BY c.blockheight DESC) C
// INNER JOIN
// (SELECT blockheight, ts 
// FROM 
// (SELECT blockheight, min(ts) AS ts
// FROM blockheight_history
// WHERE blockheight IS NOT NULL
// GROUP BY blockheight
// ORDER BY ts desc) c
// ORDER BY c.blockheight DESC) D
// ON C.BLOCKHEIGHT = D.BLOCKHEIGHT+1
// LIMIT 40) e
router.get('/blocktime', cache('2 seconds'), function (req, res, next) {
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query(`SELECT avg(e.diff)
		FROM 
		(SELECT (C.ts - D.ts) AS diff
		FROM 
		(SELECT blockheight, ts 
		FROM 
		(SELECT blockheight, min(ts) AS ts
		FROM blockheight_history
		WHERE blockheight IS NOT NULL
		GROUP BY blockheight
		ORDER BY ts desc) c
		ORDER BY c.blockheight DESC) C
		INNER JOIN
		(SELECT blockheight, ts 
		FROM 
		(SELECT blockheight, min(ts) AS ts
		FROM blockheight_history
		WHERE blockheight IS NOT NULL
		GROUP BY blockheight
		ORDER BY ts desc) c
		ORDER BY c.blockheight DESC) D
		ON C.BLOCKHEIGHT = D.BLOCKHEIGHT+1
		LIMIT 40) e`)
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					console.log('/blocktime', breakdown.rows);
					res.json({ blocktime: breakdown.rows[0].avg.seconds });
				})
		})
});

router.get('/nodes', cache('1 minute'), function (req, res, next) {
	console.log(req)
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query(`select
		addr.id,
		addr.address as hostname,
		proto.protocol,
		concat( proto.protocol, '://', addr.address ) as address,
		vpt.validated_peers_counts,
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
		f.online,
		lo.locale
	from
		address addr
	inner join locale lo on
		addr.id = lo.address_id
	inner join protocol proto on
		addr.id = proto.address_id
	left join (
			select
				address_id,
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
				max_blockheight
			from
				(
					select
						t.address_id,
						coalesce(
							m.blockheight,
							0
						) as blockheight
					from
						(
							select
								address_id,
								max(ts) as ts
							from
								blockheight_history
							group by
								address_id
						) t
					join blockheight_history m on
						m.address_id = t.address_id
						and t.ts = m.ts
				) temp cross
			join (
					select
						max(m.blockheight) as max_blockheight
					from
						(
							select
								blo_h.address_id,
								max(blo_h.ts) as ts
							from
								blockheight_history blo_h
							group by
								address_id
						) t
					join blockheight_history m on
						m.address_id = t.address_id
						and t.ts = m.ts
				) sub2
		) bhs on
		bhs.address_id = addr.id
	left join (
			select
				z.address_id,
				sum( case when online = true then 1 else 0 end ) as stability
			from
				(
					select
						*,
						row_number() over (
							partition by address_id
						order by
							id desc
						)
					from
						online_history
				) z
			where
				z.row_number <= 100
			group by
				z.address_id
		) as stab on
		stab.address_id = addr.id
	left join (
			select
				address_id,
				latency_threshold,
				max_latency,
				latency,
				1 - (
					latency_threshold / 2
				) as latency_score
			from
				(
					select
						t.address_id,
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
								lat_h.address_id,
								max(lat_h.ts) as mx
							from
								latency_history lat_h
							group by
								lat_h.address_id
						) t
					join latency_history m on
						m.address_id = t.address_id
						and t.mx = m.ts cross
					join (
							select
								max(latency_history) as max_latency
							from
								latency_history
						) max_latency_table
				) latency_threshold_table
		) as lat on
		lat.address_id = addr.id
	left join (
			select
				address_id,
				coalesce(
					online,
					false
				) as online
			from
				(
					select
						address_id,
						ts,
						online
					from
						online_history
					where
						(
							address_id,
							ts
						) in (
							select
								address_id,
								max(ts) as ts
							from
								online_history
							group by
								address_id
						)
				) temp
		) f on
		f.address_id = addr.id
	left join (
			select
				address_id,
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
						t.address_id,
						validated_peers_counts
					from
						(
							select
								address_id,
								max(ts) as ts
							from
								validated_peers_counts_history
							group by
								address_id
						) t
					join validated_peers_counts_history m on
						m.address_id = t.address_id
						and t.ts = m.ts
				) sub1 cross
			join (
					select
						max(validated_peers_counts)
					from
						(
							select
								t.address_id,
								validated_peers_counts
							from
								(
									select
										address_id,
										max(ts) as ts
									from
										validated_peers_counts_history
									group by
										address_id
								) t
							join validated_peers_counts_history m on
								m.address_id = t.address_id
								and t.ts = m.ts
						) sub2
				) sub3
		) vpt on
		vpt.address_id = addr.id
	order by
		health_score desc`)
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					console.log('/nodes', breakdown.rows)
					data = breakdown.rows

					let online_asia_nodes = []
					let online_north_america_nodes = []
					let online_europe_nodes = []

					let offline_asia_nodes = []
					let offline_north_america_nodes = []
					let offline_europe_nodes = []

					var i;
					for (i = 0; i < data.length; i++) {
						if (data[i].online == true) {
							if (data[i].locale == "jp" || data[i].locale == "cn" || data[i].locale == "sg" || data[i].locale == "in" || data[i].locale == "au") {
								online_asia_nodes.push(data[i])
							} else if (data[i].locale == "de" || data[i].locale == "gb" || data[i].locale == "nl") {
								online_europe_nodes.push(data[i])
							} else if (data[i].locale == "us" || data[i].locale == "ca") {
								online_north_america_nodes.push(data[i])
							}
						} else {
							if (data[i].locale == "jp" || data[i].locale == "cn" || data[i].locale == "sg" || data[i].locale == "in" || data[i].locale == "au") {
								offline_asia_nodes.push(data[i]);
							} else if (data[i].locale == "de" || data[i].locale == "gb" || data[i].locale == "nl") {
								offline_europe_nodes.push(data[i]);
							} else if (data[i].locale == "us" || data[i].locale == "ca") {
								offline_north_america_nodes.push(data[i]);
							}
						}
					}
					let online_nodes = { asia: online_asia_nodes, europe: online_europe_nodes, americas: online_north_america_nodes }
					let offline_nodes = { asia: offline_asia_nodes, europe: offline_europe_nodes, americas: offline_north_america_nodes }
					res.json({ online: online_nodes, offline: offline_nodes });
				})
		})
});

router.get('/nodes/:node_id', cache('2 seconds'), function (req, res, next) {
	console.log(req.params.node_id)
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query(`SELECT
			*
		FROM
			(
				select
	addr.id,
	addr.address as hostname,
	proto.protocol,
	po.port,
	coalesce(
		activep2p.p2p_tcp_status,
		false
	) as p2p_tcp_status,
	coalesce(
		activep2pws.p2p_ws_status,
		false
	) as p2p_ws_status,
	concat( proto.protocol, '://', addr.address, ':' , po.port ) as address,
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
	max_blockheight.max_blockheight
from
	address addr
inner join coordinates co on
	addr.id = co.address_id
inner join locale lo on
	addr.id = lo.address_id
inner join port po on
	addr.id = po.address_id
inner join protocol proto on
	addr.id = proto.address_id
left join (
		select
			address_id,
			p2p_tcp_status
		from
			p2p_tcp_status_history
		where
			ts = (
				select
					max( ts )
				from
					p2p_tcp_status_history
			)
	) activep2p on
	activep2p.address_id = addr.id
left join (
		select
			address_id,
			p2p_ws_status
		from
			p2p_ws_status_history
		where
			ts = (
				select
					max( ts )
				from
					p2p_ws_status_history
			)
	) activep2pws on
	activep2pws.address_id = addr.id
left join (
		select
			address_id,
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
			max_blockheight
		from
			(
				select
					t.address_id,
					coalesce(
						m.blockheight,
						0
					) as blockheight
				from
					(
						select
							address_id,
							max( ts ) as ts
						from
							blockheight_history
						group by
							address_id
					) t
				join blockheight_history m on
					m.address_id = t.address_id
					and t.ts = m.ts
			) temp cross
		join (
				select
					max( m.blockheight ) as max_blockheight
				from
					(
						select
							blo_h.address_id,
							max( blo_h.ts ) as ts
						from
							blockheight_history blo_h
						group by
							address_id
					) t
				join blockheight_history m on
					m.address_id = t.address_id
					and t.ts = m.ts
			) sub2
	) bhs on
	bhs.address_id = addr.id
left join (
		select
			z.address_id,
			sum( case when online = true then 1 else 0 end ) as stability
		from
			(
				select
					*,
					row_number() over (
						partition by address_id
					order by
						id desc
					)
				from
					online_history
			) z
		where
			z.row_number <= 100
		group by
			z.address_id
	) as stab on
	stab.address_id = addr.id
left join (
		select
			address_id,
			latency_threshold,
			max_latency,
			latency,
			1 - (
				latency_threshold / 2
			) as latency_score
		from
			(
				select
					t.address_id,
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
							lat_h.address_id,
							max( lat_h.ts ) as mx
						from
							latency_history lat_h
						group by
							lat_h.address_id
					) t
				join latency_history m on
					m.address_id = t.address_id
					and t.mx = m.ts cross
				join (
						select
							max( latency_history ) as max_latency
						from
							latency_history
					) max_latency_table
			) latency_threshold_table
	) as lat on
	lat.address_id = addr.id
left join (
		select
			address_id,
			coalesce(
				rpc_https_status,
				false
			) as rpc_https_status
		from
			(
				select
					address_id,
					ts,
					rpc_https_status
				from
					rpc_https_status_history
				where
					(
						address_id,
						ts
					) in (
						select
							address_id,
							max( ts ) as ts
						from
							rpc_https_status_history
						group by
							address_id
					)
			) temp
	) b on
	b.address_id = addr.id
left join (
		select
			address_id,
			coalesce(
				rpc_http_status,
				false
			) as rpc_http_status
		from
			(
				select
					address_id,
					ts,
					rpc_http_status
				from
					rpc_http_status_history
				where
					(
						address_id,
						ts
					) in (
						select
							address_id,
							max( ts ) as ts
						from
							rpc_http_status_history
						group by
							address_id
					)
			) temp
	) c on
	c.address_id = addr.id
left join (
		select
			address_id,
			coalesce(
				mempool_size,
				0
			) as mempool_size
		from
			(
				select
					t.address_id,
					mempool_size
				from
					(
						select
							address_id,
							max( ts ) as ts
						from
							mempool_size_history
						group by
							address_id
					) t
				join mempool_size_history m on
					m.address_id = t.address_id
					and t.ts = m.ts
			) temp
	) d on
	d.address_id = addr.id
left join (
		select
			address_id,
			coalesce(
				connection_counts,
				0
			) as connection_counts
		from
			(
				select
					t.address_id,
					connection_counts
				from
					(
						select
							address_id,
							max( ts ) as ts
						from
							connection_counts_history
						group by
							address_id
					) t
				join connection_counts_history m on
					m.address_id = t.address_id
					and t.ts = m.ts
			) temp
	) e on
	e.address_id = addr.id
left join (
		select
			address_id,
			coalesce(
				online,
				false
			) as online
		from
			(
				select
					address_id,
					ts,
					online
				from
					online_history
				where
					(
						address_id,
						ts
					) in (
						select
							address_id,
							max( ts ) as ts
						from
							online_history
						group by
							address_id
					)
			) temp
	) f on
	f.address_id = addr.id
left join (
		select
			t.address_id,
			blockheight
		from
			(
				select
					address_id,
					max( ts ) as ts
				from
					blockheight_history
				group by
					address_id
			) t
		join blockheight_history m on
			m.address_id = t.address_id
			and t.ts = m.ts
	) g on
	g.address_id = addr.id
left join (
		select
			address_id,
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
					t.address_id,
					validated_peers_counts
				from
					(
						select
							address_id,
							max( ts ) as ts
						from
							validated_peers_counts_history
						group by
							address_id
					) t
				join validated_peers_counts_history m on
					m.address_id = t.address_id
					and t.ts = m.ts
			) sub1 cross
		join (
				select
					max( validated_peers_counts )
				from
					(
						select
							t.address_id,
							validated_peers_counts
						from
							(
								select
									address_id,
									max( ts ) as ts
								from
									validated_peers_counts_history
								group by
									address_id
							) t
						join validated_peers_counts_history m on
							m.address_id = t.address_id
							and t.ts = m.ts
					) sub2
			) sub3
	) vpt on
	vpt.address_id = addr.id
left join (
		select
			address_id,
			coalesce(
				version,
				null
			) as version
		from
			(
				select
					t.address_id,
					version
				from
					(
						select
							address_id,
							max( ts ) as ts
						from
							version_history
						group by
							address_id
					) t
				join version_history m on
					m.address_id = t.address_id
					and t.ts = m.ts
			) temp
	) v on
	v.address_id = addr.id cross
join (
		select
			max( blockheight ) as max_blockheight
		from
			blockheight_history
		where
			blockheight is not null
	) max_blockheight
order by
	health_score desc
			) bigtable
		WHERE
			id = $1`, [req.params.node_id])
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					console.log('/nodes/node_id', breakdown.rows)
					res.json(breakdown.rows[0]);
				})
		})
});


// SELECT validated_peers_address_id as address_id, address , protocol
//     FROM
//     (SELECT validated_peers_address_id
//     FROM validated_peers_history 
//     WHERE ts = (SELECT max(ts)
//     FROM validated_peers_history 
//     WHERE address_id=1) 
//     AND address_id=1) updated_peers_table 
//     LEFT JOIN  
//     address 
//     ON address.id=updated_peers_table.validated_peers_address_id
//     LEFT JOIN  
//     protocol
//     on protocol.address_id=updated_peers_table.validated_peers_address_id
router.get('/nodes/:node_id/validatedpeers', cache('1 minute'), function (req, res, next) {
	pool.connect()
		.then(client => {
			return client.query('select \
    validated_peers_address_id as address_id, \
    address as hostname , \
    protocol, \
    CONCAT(proto.protocol, \'://\', address.address) as address \
  from \
    ( \
      select \
        validated_peers_address_id \
      from \
        validated_peers_history \
      where \
        ts = ( \
          select \
            max( ts ) \
          from \
            validated_peers_history \
          where \
            address_id = $1 \
        ) \
        and address_id = $1 \
    ) updated_peers_table \
  left join address on \
    address.id = updated_peers_table.validated_peers_address_id \
  left join protocol proto on \
    proto.address_id = updated_peers_table.validated_peers_address_id ', [req.params.node_id])
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					console.log('/nodes/node_id/validatedpeers', breakdown.rows)
					res.json(breakdown.rows);
				})
		})
});

// select
// 	address_id as source_address_id,
// 	address_b.address as source_address,
// 	validated_peers_address_Id,
// 	address_a.address as validated_peers_address
// from
// 	(
// 		select
// 			address_id,
// 			ts,
// 			validated_peers_address_Id
// 		from
// 			validated_peers_history
// 		where
// 			(
// 				address_id,
// 				ts
// 			) in (
// 				select
// 					address_id,
// 					max( ts )
// 				from
// 					validated_peers_history
// 				group by
// 					address_id
// 			)
// 	) max_ts_validated_peers_table
// inner join address address_a on
// 	address_a.id = max_ts_validated_peers_table.validated_peers_address_Id
// inner join address address_b on
// 	address_b.id = max_ts_validated_peers_table.address_Id
router.get('/edges', cache('1 minute'), function (req, res, next) {
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query("select \
		max_ts_validated_peers_table.address_id as source_address_id, \
		CONCAT(protob.protocol, '://', address_b.address) as source_address, \
		validated_peers_address_Id, \
		CONCAT(protoa.protocol, '://', address_a.address) validated_peers_address \
		from \
		( \
			select \
			address_id, \
			ts, \
    validated_peers_address_Id \
   from \
    validated_peers_history \
	 where \
	 ( \
		address_id, \
		ts \
	 ) in ( \
		select \
		 address_id, \
		 max( ts ) \
		from \
		 validated_peers_history \
		group by \
		 address_id \
	 ) \
	) max_ts_validated_peers_table \
	inner join address address_a on \
	 address_a.id = max_ts_validated_peers_table.validated_peers_address_Id \
	inner join address address_b on \
	 address_b.id = max_ts_validated_peers_table.address_Id \
	inner join protocol protoa on \
	 protoa.address_id =address_a.id \
	inner join protocol protob on \
	 protob.address_id =address_b.id")
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					console.log('/edges', breakdown.rows)
					res.json(breakdown.rows);
				})
		})
});

/*
select adr.id , address, protocol
from address adr
inner join protocol proto
on adr.id = proto.address_id
*/
router.get('/nodeslist', cache('1 minutes'), function (req, res, next) {
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query('select adr.id , address as hostname, protocol, CONCAT(proto.protocol, \'://\', adr.address) as address \
    from address adr \
    inner join protocol proto \
    on adr.id = proto.address_id')
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					console.log('/nodeslist', breakdown.rows)
					res.json(breakdown.rows);
				})
		})
});

router.get('/summary', function (req, res, next) {
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query('SELECT *  \
    FROM   \
    (SELECT blockheight   \
    FROM  blockheight_history  \
    WHERE blockheight IS NOT NULL  \
    ORDER BY  id DESC  \
    LIMIT 1) a  \
    CROSS JOIN(  \
    SELECT Min(ts) AS lastblock  \
    FROM blockheight_history  \
    WHERE blockheight IN ( SELECT MAX(blockheight)  \
    FROM blockheight_history )) b  \
    CROSS JOIN  \
    (SELECT avg(e.diff) AS blocktime  \
    FROM   \
    (SELECT (C.ts - D.ts) AS diff  \
    FROM   \
    (SELECT blockheight, ts   \
    FROM   \
    (SELECT blockheight, min(ts) AS ts  \
    FROM blockheight_history  \
    WHERE blockheight IS NOT NULL  \
    GROUP BY blockheight  \
    ORDER BY ts desc) c  \
    ORDER BY c.blockheight DESC) C  \
    INNER JOIN  \
    (SELECT blockheight, ts   \
    FROM   \
    (SELECT blockheight, min(ts) AS ts  \
    FROM blockheight_history  \
    WHERE blockheight IS NOT NULL  \
    GROUP BY blockheight  \
    ORDER BY ts desc) c  \
    ORDER BY c.blockheight DESC) D  \
    ON C.BLOCKHEIGHT = D.BLOCKHEIGHT+1  \
    LIMIT 40) e) z')
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					res.json(breakdown.rows);
				})
		})
});

module.exports = router;
