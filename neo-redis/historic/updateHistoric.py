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

        cursor.execute("""select ce.id, ce.protocol, n.hostname as url, n.ip as address,  ce.port, loc.locale, loca.location
								from connection_endpoints ce
								inner join
								nodes n
								on n.id=ce.node_id
								inner join
								locale loc
								on ce.id=loc.connection_id
								inner join
								location loca
								on ce.id=loca.connection_id""")

        results = cursor.fetchall()

        key = redisNamespace+"endpoints"

        r.set(key, results)

        for (id, protocol, url, address, port, locale, location) in results:
            jsonObject = {
                "protocol": protocol,
                "url": url,
                "location": location,
                "address": address,
                "locale": locale,
                "port": port,
                "type": "RPC"
            }
            r.hset(key,id,json.dumps(jsonObject))

        cursor.execute("""select  dl.timeday, coalesce(totalonline, 0) as totalonline, coalesce(total, 0) as total
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
                            order by dl.timeday""")

        results = cursor.fetchall()

        key = redisNamespace+"nodes_online_daily"

        for (day, totalonline, total) in results:
            r.hset(key, day, json.dumps({"totalonline":totalonline, "total":total}))

        cursor.execute("""select
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
                            order by ws.year, ws.week""")

        results = cursor.fetchall()

        key = redisNamespace+"nodes_online_weekly"

        for (year, week, totalonline, total) in results:
            year_week = str(int(year))+ "-" + str(int(week))
            r.hset(key, year_week, json.dumps({"totalonline":totalonline, "total":total}))

        cursor.execute("""select id from public.connection_endpoints""")

        endpoints = cursor.fetchall()

        key = redisNamespace+"node_stability_daily"

        for id in endpoints:
            cursor.execute("""select  dl.timeday, coalesce(isonline, 0) as isonline
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
                            """, [id[0]])
            result = cursor.fetchall()
            print(key, id[0],result)
            r.hset(key, int(id[0]), result)
            print("r.hget(key, id)", r.hget(key, id[0]))

        key = redisNamespace+"node_stability_weekly"

        for id in endpoints:
            cursor.execute("""select
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
                            """, [id[0]])
            result = cursor.fetchall()
            print(key, id[0], result)
            r.hset(key, int(id[0]), result)
            print("r.hget(key, id)", r.hget(key, id[0]))

        key = redisNamespace+"node_latency_daily"

        for id in endpoints:
            cursor.execute("""select
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
                            """, [id[0]])
            result = cursor.fetchall()
            print(key, id[0], result)
            r.hset(key, int(id[0]), result)
            print("r.hget(key, id)", r.hget(key, id[0]))

        key = redisNamespace+"node_latency_weekly"

        for id in endpoints:
            cursor.execute("""select
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
                            """, [id[0]])
            result = cursor.fetchall()
            print(key, id[0], result)
            print(result)
            r.hset(key, int(id[0]), result)
            print("r.hget(key, id)", r.hget(key, id[0]))


        key = redisNamespace+"blockheight_lag"

        for id in endpoints:
            cursor.execute("""select
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
                                            2537572,
                                            max( blockheight )
                                        ) as blockheight
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
                            """, [id[0]])
            result = cursor.fetchall()
            print(key, id[0], result)
            print(result)
            r.hset(key, int(id[0]), result)
            print("r.hget(key, id)", r.hget(key, id[0]))

        time.sleep(60*60*24)



