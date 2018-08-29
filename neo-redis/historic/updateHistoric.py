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

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(databasename, user, host, password)

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

DYNAMIC_ENDPOINTS_SQL="""select
                            ce.id,
                            ce.protocol,
                            n.hostname as url,
                            n.ip as address,
                            ce.port,
                            loc.locale,
                            loca.location,
                            pings.stability_thousand_pings,
                            mb.blockheight
                        from
                            connection_endpoints ce
                        inner join nodes n on
                            n.id = ce.node_id
                        inner join locale loc on
                            ce.id = loc.connection_id
                        inner join location loca on
                            ce.id = loca.connection_id
                        inner join (select connection_id, max(blockheight) as blockheight
										from blockheight_history
										group by connection_id) mb
						on ce.id = mb.connection_id
                        inner join
                        (select
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
                            z.connection_id) pings
                            on pings.connection_id=ce.id"""

NODES_ONLINE_DAILY_SQL = """select  dl.timeday, coalesce(totalonline, 0) as totalonline, coalesce(total, 0) as total
                            from
                            (select to_char(
                                    generate_series(min(ts),
                                                        max(ts),
                                                        '1 day'::interval
                                                        ) ,
                                            'yyyy-mm-dd'
                                        ) timeday
                            from online_history) dl
                            left join 
                            (select timeday, sum(isonline) totalonline, count(isonline) total
                            from 
                            (select
                                to_char(
                                    ts,
                                    'yyyy-mm-dd'
                                ) timeday,
                                connection_id,
                                case 
                                    when avg( cast( online as int )) > 0.5 then 1
                                    else 0
                                end isonline
                            from
                                public.online_history
                            group by
                                to_char(
                                    ts,
                                    'yyyy-mm-dd'
                                ),
                                connection_id) oh
                            group by timeday) networksize
                            on dl.timeday = networksize.timeday
                            order by dl.timeday"""

NODES_ONLINE_WEEKLY = """select
                            ws.year,
                            ws.week,
                            totalonline,
                            total
                        from
                            (
                                select
                                    date_part(
                                        'year',
                                        temp.timeday::date
                                    ) as year,
                                    date_part(
                                        'week',
                                        temp.timeday::date
                                    ) as week
                                from
                                    (
                                        select
                                            generate_series(
                                                min( ts ),
                                                max( ts ),
                                                '1 week'::interval
                                            ) timeday
                                        from
                                            online_history
                                    ) temp
                            ) ws
                        left join 
                        (select year, week, sum(isonline) totalonline, count(isonline) total
                        from 
                        (select
                            date_part(
                                'year',
                                ts::date
                            ) as year,
                            date_part(
                                'week',
                                ts::date
                            ) as week,
                            connection_id,
                            case 
                                when avg( cast( online as int )) > 0.5 then 1
                                else 0
                            end isonline
                        from
                            public.online_history
                        group by
                                year,
                                week,
                            connection_id) oh
                        group by year,
                                week) networksize_weekly on
                            networksize_weekly.year = ws.year
                            and networksize_weekly.week = ws.week
                            order by ws.year, ws.week"""

NODES_STABLILTY_DAILY_SQL="""select  dl.timeday, coalesce(isonline, 0) as isonline
                                from
                                (select to_char(
                                        generate_series(min(ts),
                                                            max(ts),
                                                            '1 day'::interval
                                                            ) ,
                                                'yyyy-mm-dd'
                                            ) timeday
                                from online_history) dl
                                left join
                                (select
                                    to_char(
                                        ts,
                                        'yyyy-mm-dd'
                                    ) timeday,
                                    case 
                                        when avg( cast( online as int )) > 0.5 then 1
                                        else 0
                                    end isonline
                                from
                                    public.online_history
                                where
                                    connection_id=%s
                                group by
                                    to_char(
                                        ts,
                                        'yyyy-mm-dd'
                                    )
                                ) st 
                                on st.timeday = dl.timeday
                                order by dl.timeday
                            """

NODES_STABLILTY_WEEKLY_SQL = """select
                                ws.year,
                                ws.week,
                                isonline
                            from
                                (
                                    select
                                        date_part(
                                            'year',
                                            temp.timeday::date
                                        ) as year,
                                        date_part(
                                            'week',
                                            temp.timeday::date
                                        ) as week
                                    from
                                        (
                                            select
                                                generate_series(
                                                    min( ts ),
                                                    max( ts ),
                                                    '1 week'::interval
                                                ) timeday
                                            from
                                                online_history
                                        ) temp
                                ) ws
                            left join (
                                    select
                                        date_part(
                                            'year',
                                            ts::date
                                        ) as year,
                                        date_part(
                                            'week',
                                            ts::date
                                        ) as week,
                                        case
                                            when avg( cast( online as int )) > 0.5 then 1
                                            else 0
                                        end isonline
                                    from
                                        public.online_history
                                    where
                                        connection_id = 1
                                    group by
                                        year,
                                        week
                                    order by
                                        year,
                                        week
                                ) ohw on
                                ohw.year = ws.year
                                and ohw.week = ws.week
                                order by ws.year, ws.week
                            """

NODES_LATENCY_DAILY_SQL = """select
                            dl.timeday,
                            coalesce(
                                avg_latency*1000,
                                2 * 1000
                            ) as avg_latency
                        from
                            (
                                select
                                    to_char(
                                        generate_series(
                                            min( ts ),
                                            max( ts ),
                                            '1 day'::interval
                                        ) ,
                                        'yyyy-mm-dd'
                                    ) timeday
                                from
                                    latency_history
                            ) dl
                        left join (
                                select
                                    to_char(
                                        ts,
                                        'yyyy-mm-dd'
                                    ) timeday,
                                    avg(latency_history) as avg_latency
                                from
                                    public.latency_history
                                where
                                    connection_id = %s
                                group by
                                    to_char(
                                        ts,
                                        'yyyy-mm-dd'
                                    )
                            ) lt on
                            lt.timeday = dl.timeday
                            order by dl.timeday
                            """
NODES_LATENCY_WEEKLY_SQL = """select
                                ws.year,
                                ws.week,
                                coalesce(
                                    avg_latency*1000,
                                    2 * 1000
                                ) as avg_latency
                            from
                                (
                                    select
                                        date_part(
                                            'year',
                                            temp.timeday::date
                                        ) as year,
                                        date_part(
                                            'week',
                                            temp.timeday::date
                                        ) as week
                                    from
                                        (
                                            select
                                                generate_series(
                                                    min( ts ),
                                                    max( ts ),
                                                    '1 week'::interval
                                                ) timeday
                                            from
                                                online_history
                                        ) temp
                                ) ws
                            left join
                            (select
                                date_part(
                                    'year',
                                    ts::date
                                ) as year,
                                date_part(
                                    'week',
                                    ts::date
                                ) as week,
                                connection_id,
                                avg(latency_history) as avg_latency
                            from
                                public.latency_history
                            where
                                connection_id = %s
                            group by
                                year,
                                week,
                                connection_id
                            order by
                                year,
                                week) lt on
                                lt.year = ws.year
                                and lt.week = ws.week
                                order by ws.year, ws.week
                            """

NODES_BLOCKLAG_SQL = """select
                                blocklist.blockheight,
                                min_ts,
                                max_ts,
                                bh.blockheight as node_blockheight,
                                (
                                    blocklist.blockheight - bh.blockheight
                                ) as block_lag
                            from
                                (
                                   select
                                        generate_series(
                                            2537572/100,
                                            max( blockheight)/100
                                        ) * 100 as blockheight
                                    from
                                        public.blockheight_history
                                ) blocklist
                            left join (
                                    select
                                        blockheight,
                                        min(ts) as min_ts
                                    from
                                        public.blockheight_history
                                    group by
                                        blockheight
                                ) min_ts_t on
                                min_ts_t.blockheight = blocklist.blockheight
                            left join (
                                    select
                                        blockheight,
                                        min(ts) as max_ts
                                    from
                                        public.blockheight_history
                                    group by
                                        blockheight
                                ) max_ts_t on
                                max_ts_t.blockheight = blocklist.blockheight + 1
                            left join (
                                    select
                                        blockheight,
                                        connection_id,
                                        max( ts ) as ts
                                    from
                                        public.blockheight_history
                                    where
                                        connection_id = %s
                                    group by
                                        blockheight,
                                        connection_id
                                ) bh on
                                bh.ts between min_ts_t.min_ts and max_ts_t.max_ts::timestamp - interval '1 seconds'
                            order by
                                blocklist.blockheight desc
                            limit 10000
                            """

SLEEP_TIME = 60*60*24

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

        cursor.execute("""select id from public.connection_endpoints""")
        endpoints = cursor.fetchall()

        t0 = time.time()
        cursor.execute(DYNAMIC_ENDPOINTS_SQL)

        results = cursor.fetchall()

        key = redisNamespace+"dynamic_connection_endpoints"

        bestblock = int(r.get(redisNamespace+'bestblock'))
        
        for (id, protocol, url, address, port, locale, location, pings_score, node_blockheight) in results:
            diffBlocks = abs(node_blockheight-bestblock)
            if pings_score != 0 and diffBlocks<20:
                jsonObject = {
                    "protocol": protocol,
                    "url": url,
                    "location": location,
                    "address": address,
                    "locale": locale,
                    "port": port,
                    "type": "RPC"
                }
                logger.info(key)
                logger.info("jsonObject: {}".format(jsonObject))
                r.hset(key, str(id) , json.dumps(jsonObject))
        t1 = time.time()
        logger.info('{} Took {} ms'.format(key, (1000*(t1-t0))))

        t0 = time.time()
        cursor.execute(NODES_ONLINE_DAILY_SQL)

        results = cursor.fetchall()

        key = redisNamespace+"nodes_online_daily"

        for (day, totalonline, total) in results:
            logger.info(key)
            logger.info({"totalonline":totalonline, "total":total})
            r.hset(key, day, json.dumps({"totalonline":totalonline, "total":total}))
        
        t1 = time.time()
        logger.info('{} Took {} ms'.format(key, (1000*(t1-t0))))

        t0 = time.time()
        cursor.execute(NODES_ONLINE_WEEKLY)
        results = cursor.fetchall()

        key = redisNamespace+"nodes_online_weekly"

        for (year, week, totalonline, total) in results:
            year_week = str(int(year))+ "-" + str(int(week))
            logger.info(key)
            logger.info({"totalonline":totalonline, "total":total})
            r.hset(key, year_week, json.dumps({"totalonline":totalonline, "total":total}))
        
        t1 = time.time()
        logger.info('{} Took {} ms'.format(key, (1000*(t1-t0))))

        key = redisNamespace+"node_stability_daily"
        t0 = time.time()

        for id in endpoints:
            cursor.execute(NODES_STABLILTY_DAILY_SQL, [id[0]])
            result = cursor.fetchall()
            logger.info("len(result) {}".format(len(result)))
            r.hset(key, int(id[0]), result)
            logger.info(key)
            logger.info(id[0])
        
        t1 = time.time()
        logger.info('{} Took {} ms'.format(key, (1000*(t1-t0))))

        key = redisNamespace+"node_stability_weekly"
        t0 = time.time()

        for id in endpoints:
            cursor.execute(NODES_STABLILTY_WEEKLY_SQL, [id[0]])
            result = cursor.fetchall()
            logger.info("len(result) {}".format(len(result)))
            r.hset(key, int(id[0]), result)
            logger.info(key)
            logger.info(id[0])

        t1 = time.time()
        logger.info('{} Took {} ms'.format(key, (1000*(t1-t0))))

        key = redisNamespace+"node_latency_daily"
        t0 = time.time()

        for id in endpoints:
            cursor.execute(NODES_LATENCY_DAILY_SQL, [id[0]])
            result = cursor.fetchall()
            logger.info("len(result) {}".format(len(result)))
            r.hset(key, int(id[0]), result)
            logger.info(key)
            logger.info(id[0])
        
        t1 = time.time()
        logger.info('{} Took {} ms'.format(key, (1000*(t1-t0))))

        key = redisNamespace+"node_latency_weekly"
        t0 = time.time()

        for id in endpoints:
            cursor.execute(NODES_LATENCY_WEEKLY_SQL, [id[0]])
            result = cursor.fetchall()
            logger.info("len(result) {}".format(len(result)))
            r.hset(key, int(id[0]), result)
            logger.info(key)
            logger.info(id[0])
        
        t1 = time.time()
        logger.info('{} Took {} ms'.format(key, (1000*(t1-t0))))

        key = redisNamespace+"blockheight_lag"
        t0 = time.time()

        for id in endpoints:
            logger.info("endpoints: {}".format(id[0]))
            cursor.execute(NODES_BLOCKLAG_SQL, [id[0]])
            result = cursor.fetchall()
            logger.info("len(result) {}".format(len(result)))
            r.hset(key, int(id[0]), result)
            logger.info(key)
            logger.info(id[0])
        
        t1 = time.time()
        logger.info('{} Took {} ms'.format(key, (1000*(t1-t0))))

        time.sleep(SLEEP_TIME)
