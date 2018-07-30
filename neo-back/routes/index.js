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
router.get('/bestblock', cache('1 seconds'), function (req, res, next) {
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query(`SELECT max(blockheight) 
								FROM  blockheight_history  
								WHERE blockheight IS NOT NULL`)
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
			return client.query(`SELECT EXTRACT(EPOCH FROM Min(ts) AT TIME ZONE 'UTC') as min_ts  
								FROM  blockheight_history 
								WHERE blockheight IN ( SELECT MAX(blockheight) 
								FROM blockheight_history )`)
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
			return client.query(`select
								ce.id as connection_id,
								ce.protocol,
								n.hostname,
								ce.port,
								unconfirm_tx_table.node_count,
								unconfirm_tx_table.tx,
								unconfirm_tx_table.last_blockheight
							from
								(
									select
										max( connection_id ) as connection_id,
										count( connection_id ) as node_count,
										tx,
										max( last_blockheight ) as last_blockheight
									from
										public.unconfirmed_tx
									where
										last_blockheight = (
											select
												max( blockheight )
											from
												blockheight_history
										)
									group by
										tx
									order by
										node_count desc
								) unconfirm_tx_table
							inner join connection_endpoints ce on
								ce.id = unconfirm_tx_table.connection_id
							inner join nodes n on
								n.id = ce.node_id`)
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
			return client.query(`select
					concat( ce.protocol, '://', n.hostname, ':', ce.port ) as url
				from
					connection_endpoints ce
				inner join nodes n on
					ce.node_id = n.id
				where
					ce.id = $1`, [addressid])
				.catch((error) => {
					client.release();
					console.log(error)
				})
				.then(breakdown => {
					client.release()
					console.log(breakdown.rows)
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
								max_blockheight.max_blockheight
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
										p2p_tcp_status_history
									where
										ts = (
											select
												max( ts )
											from
												p2p_tcp_status_history
										)
								) activep2p on
								activep2p.connection_id = endpoints.id
							left join (
									select
										connection_id,
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
										max_blockheight
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
														max( ts ) as ts
													from
														blockheight_history
													group by
														connection_id
												) t
											join blockheight_history m on
												m.connection_id = t.connection_id
												and t.ts = m.ts
										) temp cross
									join (
											select
												max( m.blockheight ) as max_blockheight
											from
												(
													select
														blo_h.connection_id,
														max( blo_h.ts ) as ts
													from
														blockheight_history blo_h
													group by
														connection_id
												) t
											join blockheight_history m on
												m.connection_id = t.connection_id
												and t.ts = m.ts
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
												online_history
										) z
									where
										z.row_number <= 100
									group by
										z.connection_id
								) as stab on
								stab.connection_id = endpoints.id
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
														latency_history lat_h
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
														latency_history
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
												rpc_https_status_history
											where
												(
													connection_id,
													ts
												) in (
													select
														connection_id,
														max( ts ) as ts
													from
														rpc_https_status_history
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
												rpc_http_status_history
											where
												(
													connection_id,
													ts
												) in (
													select
														connection_id,
														max( ts ) as ts
													from
														rpc_http_status_history
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
														max( ts ) as ts
													from
														mempool_size_history
													group by
														connection_id
												) t
											join mempool_size_history m on
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
														max( ts ) as ts
													from
														connection_counts_history
													group by
														connection_id
												) t
											join connection_counts_history m on
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
												online_history
											where
												(
													connection_id,
													ts
												) in (
													select
														connection_id,
														max( ts ) as ts
													from
														online_history
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
												max( ts ) as ts
											from
												blockheight_history
											group by
												connection_id
										) t
									join blockheight_history m on
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
														max( ts ) as ts
													from
														validated_peers_counts_history
													group by
														connection_id
												) t
											join validated_peers_counts_history m on
												m.connection_id = t.connection_id
												and t.ts = m.ts
										) sub1 cross
									join (
											select
												max( validated_peers_counts )
											from
												(
													select
														t.connection_id,
														validated_peers_counts
													from
														(
															select
																connection_id,
																max( ts ) as ts
															from
																validated_peers_counts_history
															group by
																connection_id
														) t
													join validated_peers_counts_history m on
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
														max( ts ) as ts
													from
														version_history
													group by
														connection_id
												) t
											join version_history m on
												m.connection_id = t.connection_id
												and t.ts = m.ts
										) temp
								) v on
								v.connection_id = endpoints.id cross
							join (
									select
										max( blockheight ) as max_blockheight
									from
										blockheight_history
									where
										blockheight is not null
								) max_blockheight
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
							if (data[i].locale == "jp" || data[i].locale == "kr" || data[i].locale == "cn" || data[i].locale == "sg" || data[i].locale == "in" || data[i].locale == "au") {
								online_asia_nodes.push(data[i])
							} else if (data[i].locale == "de" || data[i].locale == "ch" || data[i].locale == "gb" || data[i].locale == "nl") {
								online_europe_nodes.push(data[i])
							} else if (data[i].locale == "us" || data[i].locale == "br" || data[i].locale == "ca") {
								online_north_america_nodes.push(data[i])
							}
						} else {
							if (data[i].locale == "jp" || data[i].locale == "kr" || data[i].locale == "cn" || data[i].locale == "sg" || data[i].locale == "in" || data[i].locale == "au") {
								offline_asia_nodes.push(data[i]);
							} else if (data[i].locale == "de" || data[i].locale == "ch" || data[i].locale == "gb" || data[i].locale == "nl") {
								offline_europe_nodes.push(data[i]);
							} else if (data[i].locale == "us" || data[i].locale == "br" || data[i].locale == "ca") {
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
			return client.query(`SELECT * FROM
				(select
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
				max_blockheight.max_blockheight
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
						p2p_tcp_status_history
					where
						ts = (
							select
								max( ts )
							from
								p2p_tcp_status_history
						)
				) activep2p on
				activep2p.connection_id = endpoints.id
			left join (
					select
						connection_id,
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
						max_blockheight
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
										max( ts ) as ts
									from
										blockheight_history
									group by
										connection_id
								) t
							join blockheight_history m on
								m.connection_id = t.connection_id
								and t.ts = m.ts
						) temp cross
					join (
							select
								max( m.blockheight ) as max_blockheight
							from
								(
									select
										blo_h.connection_id,
										max( blo_h.ts ) as ts
									from
										blockheight_history blo_h
									group by
										connection_id
								) t
							join blockheight_history m on
								m.connection_id = t.connection_id
								and t.ts = m.ts
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
								online_history
						) z
					where
						z.row_number <= 100
					group by
						z.connection_id
				) as stab on
				stab.connection_id = endpoints.id
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
										latency_history lat_h
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
										latency_history
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
								rpc_https_status_history
							where
								(
									connection_id,
									ts
								) in (
									select
										connection_id,
										max( ts ) as ts
									from
										rpc_https_status_history
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
								rpc_http_status_history
							where
								(
									connection_id,
									ts
								) in (
									select
										connection_id,
										max( ts ) as ts
									from
										rpc_http_status_history
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
										max( ts ) as ts
									from
										mempool_size_history
									group by
										connection_id
								) t
							join mempool_size_history m on
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
										max( ts ) as ts
									from
										connection_counts_history
									group by
										connection_id
								) t
							join connection_counts_history m on
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
								online_history
							where
								(
									connection_id,
									ts
								) in (
									select
										connection_id,
										max( ts ) as ts
									from
										online_history
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
								max( ts ) as ts
							from
								blockheight_history
							group by
								connection_id
						) t
					join blockheight_history m on
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
										max( ts ) as ts
									from
										validated_peers_counts_history
									group by
										connection_id
								) t
							join validated_peers_counts_history m on
								m.connection_id = t.connection_id
								and t.ts = m.ts
						) sub1 cross
					join (
							select
								max( validated_peers_counts )
							from
								(
									select
										t.connection_id,
										validated_peers_counts
									from
										(
											select
												connection_id,
												max( ts ) as ts
											from
												validated_peers_counts_history
											group by
												connection_id
										) t
									join validated_peers_counts_history m on
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
										max( ts ) as ts
									from
										version_history
									group by
										connection_id
								) t
							join version_history m on
								m.connection_id = t.connection_id
								and t.ts = m.ts
						) temp
				) v on
				v.connection_id = endpoints.id cross
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

router.get('/nodes/:node_id/validatedpeers', cache('1 minute'), function (req, res, next) {
	pool.connect()
		.then(client => {
			return client.query(`select 
			validated_peers_connection_id as connection_id, 
			n.hostname , 
			ce.protocol, 
			CONCAT(ce.protocol, '://', n.hostname) as address 
		  from 
			( 
			  select 
				validated_peers_connection_id
			  from 
				validated_peers_history 
			  where 
				ts = ( 
				  select 
					max( ts ) 
				  from 
					validated_peers_history 
				  where 
					connection_id= $1 
				) 
				and connection_id = $1 
			) updated_peers_table 
		  left join connection_endpoints ce on 
			ce.id = updated_peers_table.validated_peers_connection_id 
		  left join nodes n on
			  ce.node_id=n.id`, [req.params.node_id])
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

router.get('/edges', cache('1 minute'), function (req, res, next) {
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query(`select
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
			node_b.id = endpoint_b.node_id`)
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

router.get('/nodeslist', cache('1 minutes'), function (req, res, next) {
	pool.connect()
		.then(client => {
			console.log("pool.totalCount", pool.totalCount)
			console.log("pool.idleCount", pool.idleCount)
			console.log("pool.waitingCount", pool.waitingCount)
			return client.query(`select endpoint.id , n.hostname, endpoint.protocol, CONCAT(endpoint.protocol, '://', n.hostname) as address 
								from connection_endpoints endpoint 
								inner join nodes n
								on n.id = endpoint.node_id`)
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

module.exports = router;
