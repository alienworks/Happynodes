var express = require('express');
var router = express.Router();
var apicache = require('apicache');
const { Pool } = require('pg')

var types = require('pg').types
types.setTypeParser(20, function(val) {
  return parseInt(val)
})

let cache = apicache.middleware

const pool = new Pool({
  max: 200, 
  idleTimeoutMillis: 3000,
  connectionTimeoutMillis: 3000})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({ title: 'Express' });
});

// Took 154ms
// SELECT max(blockheight)
// FROM  blockheight_history
// WHERE blockheight IS NOT NULL
router.get('/bestblock',cache('1 seconds'), function(req, res, next) {
  pool.connect()
  .then( client =>{
    console.log("pool.totalCount", pool.totalCount)
    console.log("pool.idleCount", pool.idleCount)
    console.log("pool.waitingCount", pool.waitingCount)
    return client.query('SELECT max(blockheight)  \
    FROM  blockheight_history  \
    WHERE blockheight IS NOT NULL')
    .catch((error)=>{
      client.release();
      console.log(error);
    })
    .then(breakdown => {
      client.release()
			console.log('/bestblock', breakdown.rows);
			res.json({bestblock:breakdown.rows[0].max});
    })
  })
});

// Took 143ms
// SELECT Min(ts)
// FROM blockheight_history
// WHERE blockheight IN ( SELECT MAX(blockheight)
// FROM blockheight_history );
router.get('/lastblock', cache('1 seconds'), function(req, res, next) {
  pool.connect()
  .then( client =>{
    console.log("pool.totalCount", pool.totalCount)
    console.log("pool.idleCount", pool.idleCount)
    console.log("pool.waitingCount", pool.waitingCount)
    return client.query("SELECT EXTRACT(EPOCH FROM Min(ts) AT TIME ZONE 'UTC') as min_ts  \
                          FROM  blockheight_history \
                          WHERE blockheight IN ( SELECT MAX(blockheight) \
                          FROM blockheight_history )")
    .catch((error)=>{
      client.release();
      console.log(error)
    })
    .then(breakdown => {
      client.release()
			console.log('/lastblock', breakdown.rows);
			res.json({lastblock:breakdown.rows[0].min_ts});
    })
  })
});

router.get('/unconfirmed', cache('2 seconds'), function(req, res, next) {
  pool.connect()
  .then( client =>{
    console.log("pool.totalCount", pool.totalCount)
    console.log("pool.idleCount", pool.idleCount)
    console.log("pool.waitingCount", pool.waitingCount)
    return client.query('SELECT count(address_id) as node_count, tx, max(last_blockheight) \
		FROM public.unconfirmed_tx \
		where last_blockheight = (select max(blockheight) from blockheight_history) \
		group by tx \
		order by node_count desc')
    .catch((error)=>{
      client.release();
      console.log(error)
    })
    .then(breakdown => {
			client.release()
			console.log('/unconfirmed length', breakdown.rows.length);
			res.json({txs:breakdown.rows});
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
router.get('/blocktime', cache('2 seconds'), function(req, res, next) {
  pool.connect()
  .then( client =>{
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
    .catch((error)=>{
      client.release();
      console.log(error)
    })
    .then(breakdown => {
			client.release()
			console.log('/blocktime', breakdown.rows);
			res.json({blocktime:breakdown.rows[0].avg.seconds});
    })
  })
});

router.get('/nodes', cache('1 minute'), function(req, res, next) {
	console.log(req)
  pool.connect()
  .then( client =>{
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
			lat.latency,
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
    .catch((error)=>{
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
          if (data[i].online==true) {
            if (data[i].locale=="jp" || data[i].locale=="cn"|| data[i].locale=="sg"|| data[i].locale=="in"|| data[i].locale=="au"){
              online_asia_nodes.push(data[i])
            }else if (data[i].locale=="de" || data[i].locale=="gb" || data[i].locale=="nl"){
              online_europe_nodes.push(data[i])
            }else if (data[i].locale=="us" || data[i].locale=="ca"){
              online_north_america_nodes.push(data[i])
            }
          }else{
            if (data[i].locale=="jp" || data[i].locale=="cn"|| data[i].locale=="sg"|| data[i].locale=="in"|| data[i].locale=="au"){
              offline_asia_nodes.push(data[i]);
            }else if (data[i].locale=="de" || data[i].locale=="gb" || data[i].locale=="nl"){
              offline_europe_nodes.push(data[i]);
            }else if (data[i].locale=="us" || data[i].locale=="ca"){
              offline_north_america_nodes.push(data[i]);
            }
          }
      }
      let online_nodes = {asia:online_asia_nodes, europe:online_europe_nodes, americas:online_north_america_nodes}
      let offline_nodes = {asia:offline_asia_nodes, europe:offline_europe_nodes, americas:offline_north_america_nodes}
      res.json({online:online_nodes, offline:offline_nodes});
    })
  })
});

router.get('/nodes/:node_id', cache('2 seconds'), function(req, res, next) {
  console.log(req.params.node_id)
  pool.connect()
  .then( client =>{
    console.log("pool.totalCount", pool.totalCount)
    console.log("pool.idleCount", pool.idleCount)
    console.log("pool.waitingCount", pool.waitingCount)
    return client.query(`SELECT
			*
		FROM
			(
				SELECT
					addr.id,
					addr.address AS hostname,
					proto.protocol,
					po.port,
							 COALESCE(p2p_tcp_status, false) AS p2p_tcp_status,
					concat( proto.protocol, '://', addr.address, ':' , po.port ) AS address,
					coalesce(
						vpt.validated_peers_counts,
						0
					) AS validated_peers_counts,
					coalesce(
						stab.stability,
						0
					) AS stability,
					coalesce(
						bhs.blockheight_score* 100,
						0
					) AS blockheight_score,
					coalesce(
						(latency_score)* 100,
						0
					) AS normalised_latency_score,
					coalesce(
						vpt.validated_peers_counts_score * 100,
						0
					) AS validated_peers_counts_score,
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
					)/ 4.0 AS health_score,
					coalesce(
						lat.latency,
						200
					) AS latency,
					b.rpc_https_status as rpc_https_status,
					c.rpc_http_status as rpc_http_status,
					coalesce(
						d.mempool_size,
						0
					) AS mempool_size,
					coalesce(
						e.connection_counts,
						0
					) AS connection_counts,
					f.online,
					coalesce(
						g.blockheight,
						0
					) AS blockheight,
					co.lat,
					co.long,
					lo.locale,
					version,
					max_blockheight.max_blockheight
				FROM
					address addr
				INNER JOIN coordinates co ON
					addr.id = co.address_id
				INNER JOIN locale lo ON
					addr.id = lo.address_id
				INNER JOIN port po ON
					addr.id = po.address_id
				INNER JOIN protocol proto ON
					addr.id = proto.address_id
				LEFT JOIN
				(SELECT address_id, p2p_tcp_status
				FROM p2p_tcp_status_history
				WHERE ts = (SELECT max(ts)
				FROM p2p_tcp_status_history)) activep2p
				ON activep2p.address_id = addr.id
				LEFT JOIN (
						SELECT
							address_id,
							(
								CASE
									WHEN (
										(
											max_blockheight - blockheight
										) < 50
									) THEN coalesce(
										1 - (
											(
												max_blockheight + 0.0
											) - blockheight
										)/ 50,
										0
									)
									ELSE 0
								END
							) AS blockheight_score,
							max_blockheight
						FROM
							(
								SELECT
									t.address_id,
									coalesce(
										m.blockheight,
										0
									) AS blockheight
								FROM
									(
										SELECT
											address_id,
											max(ts) AS ts
										FROM
											blockheight_history
										GROUP BY
											address_id
									) t
								JOIN blockheight_history m ON
									m.address_id = t.address_id
									AND t.ts = m.ts
							) temp CROSS
						JOIN (
								SELECT
									max(m.blockheight) AS max_blockheight
								FROM
									(
										SELECT
											blo_h.address_id,
											max(blo_h.ts) AS ts
										FROM
											blockheight_history blo_h
										GROUP BY
											address_id
									) t
								JOIN blockheight_history m ON
									m.address_id = t.address_id
									AND t.ts = m.ts
							) sub2
					) bhs ON
					bhs.address_id = addr.id
				LEFT JOIN (
						SELECT
							z.address_id,
							sum( CASE WHEN online = TRUE THEN 1 ELSE 0 END ) AS stability
						FROM
							(
								SELECT
									*,
									row_number() OVER (
										PARTITION by address_id
									ORDER BY
										id DESC
									)
								FROM
									online_history
							) z
						WHERE
							z.row_number <= 100
						GROUP BY
							z.address_id
					) AS stab ON
					stab.address_id = addr.id
				LEFT JOIN (
						SELECT
							address_id,
							latency_threshold,
							max_latency,
							latency,
							1 - (
								latency_threshold / 2
							) AS latency_score
						FROM
							(
								SELECT
									t.address_id,
									CASE
										WHEN (
											latency_history < 2
										) THEN latency_history
										ELSE 2
									END AS latency_threshold,
									m.latency_history AS latency,
									max_latency
								FROM
									(
										SELECT
											lat_h.address_id,
											max(lat_h.ts) AS mx
										FROM
											latency_history lat_h
										GROUP BY
											lat_h.address_id
									) t
								JOIN latency_history m ON
									m.address_id = t.address_id
									AND t.mx = m.ts CROSS
								JOIN (
										SELECT
											max(latency_history) AS max_latency
										FROM
											latency_history
									) max_latency_table
							) latency_threshold_table
					) AS lat ON
					lat.address_id = addr.id
				LEFT JOIN (
						SELECT
							address_id,
							coalesce(
								rpc_https_status,
								FALSE
							) AS rpc_https_status
						FROM
							(
								SELECT
									address_id,
									ts,
									rpc_https_status
								FROM
									rpc_https_status_history
								WHERE
									(
										address_id,
										ts
									) IN (
										SELECT
											address_id,
											max(ts) AS ts
										FROM
											rpc_https_status_history
										GROUP BY
											address_id
									)
							) temp
					) b ON
					b.address_id = addr.id
				LEFT JOIN (
						SELECT
							address_id,
							coalesce(
								rpc_http_status,
								FALSE
							) AS rpc_http_status
						FROM
							(
								SELECT
									address_id,
									ts,
									rpc_http_status
								FROM
									rpc_http_status_history
								WHERE
									(
										address_id,
										ts
									) IN (
										SELECT
											address_id,
											max(ts) AS ts
										FROM
											rpc_http_status_history
										GROUP BY
											address_id
									)
							) temp
					) c ON
					c.address_id = addr.id
				LEFT JOIN (
						SELECT
							address_id,
							coalesce(
								mempool_size,
								0
							) AS mempool_size
						FROM
							(
								SELECT
									t.address_id,
									mempool_size
								FROM
									(
										SELECT
											address_id,
											max(ts) AS ts
										FROM
											mempool_size_history
										GROUP BY
											address_id
									) t
								JOIN mempool_size_history m ON
									m.address_id = t.address_id
									AND t.ts = m.ts
							) temp
					) d ON
					d.address_id = addr.id
				LEFT JOIN (
						SELECT
							address_id,
							coalesce(
								connection_counts,
								0
							) AS connection_counts
						FROM
							(
								SELECT
									t.address_id,
									connection_counts
								FROM
									(
										SELECT
											address_id,
											max(ts) AS ts
										FROM
											connection_counts_history
										GROUP BY
											address_id
									) t
								JOIN connection_counts_history m ON
									m.address_id = t.address_id
									AND t.ts = m.ts
							) temp
					) e ON
					e.address_id = addr.id
				LEFT JOIN (
						SELECT
							address_id,
							coalesce(
								online,
								FALSE
							) AS online
						FROM
							(
								SELECT
									address_id,
									ts,
									online
								FROM
									online_history
								WHERE
									(
										address_id,
										ts
									) IN (
										SELECT
											address_id,
											max(ts) AS ts
										FROM
											online_history
										GROUP BY
											address_id
									)
							) temp
					) f ON
					f.address_id = addr.id
				LEFT JOIN (
						SELECT
							t.address_id,
							blockheight
						FROM
							(
								SELECT
									address_id,
									max(ts) AS ts
								FROM
									blockheight_history
								GROUP BY
									address_id
							) t
						JOIN blockheight_history m ON
							m.address_id = t.address_id
							AND t.ts = m.ts
					) g ON
					g.address_id = addr.id
				LEFT JOIN (
						SELECT
							address_id,
							coalesce(
								validated_peers_counts,
								0
							) AS validated_peers_counts,
							coalesce(
								validated_peers_counts*1.0 / max,
								0
							) AS validated_peers_counts_score
						FROM
							(
								SELECT
									t.address_id,
									validated_peers_counts
								FROM
									(
										SELECT
											address_id,
											max(ts) AS ts
										FROM
											validated_peers_counts_history
										GROUP BY
											address_id
									) t
								JOIN validated_peers_counts_history m ON
									m.address_id = t.address_id
									AND t.ts = m.ts
							) sub1 CROSS
						JOIN (
								SELECT
									max(validated_peers_counts)
								FROM
									(
										SELECT
											t.address_id,
											validated_peers_counts
										FROM
											(
												SELECT
													address_id,
													max(ts) AS ts
												FROM
													validated_peers_counts_history
												GROUP BY
													address_id
											) t
										JOIN validated_peers_counts_history m ON
											m.address_id = t.address_id
											AND t.ts = m.ts
									) sub2
							) sub3
					) vpt ON
					vpt.address_id = addr.id
				LEFT JOIN (
						SELECT
							address_id,
							coalesce(
								version,
								NULL
							) AS version
						FROM
							(
								SELECT
									t.address_id,
									version
								FROM
									(
										SELECT
											address_id,
											max(ts) AS ts
										FROM
											version_history
										GROUP BY
											address_id
									) t
								JOIN version_history m ON
									m.address_id = t.address_id
									AND t.ts = m.ts
							) temp
					) v ON
					v.address_id = addr.id CROSS
				JOIN (
						SELECT
							max(blockheight) AS max_blockheight
						FROM
							blockheight_history
						WHERE
							blockheight IS NOT NULL
					) max_blockheight
				ORDER BY
					health_score DESC
			) bigtable
		WHERE
			id = $1`, [req.params.node_id])
    .catch((error)=>{
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
router.get('/nodes/:node_id/validatedpeers', cache('1 minute'), function(req, res, next) {
  pool.connect()
  .then( client =>{
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
    .catch((error)=>{
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
router.get('/edges', cache('1 minute'), function(req, res, next) {
  pool.connect()
  .then( client =>{
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
    .catch((error)=>{
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
router.get('/nodeslist', cache('1 minutes'), function(req, res, next) {
  pool.connect()
  .then( client =>{
    console.log("pool.totalCount", pool.totalCount)
    console.log("pool.idleCount", pool.idleCount)
    console.log("pool.waitingCount", pool.waitingCount)
    return client.query('select adr.id , address as hostname, protocol, CONCAT(proto.protocol, \'://\', adr.address) as address \
    from address adr \
    inner join protocol proto \
    on adr.id = proto.address_id')
    .catch((error)=>{
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

router.get('/summary', function(req, res, next) {
  pool.connect()
  .then( client =>{
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
    .catch((error)=>{
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
