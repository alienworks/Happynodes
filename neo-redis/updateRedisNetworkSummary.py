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

        cursor.execute('SELECT max(blockheight)  \
        FROM  blockheight_history  \
        WHERE blockheight IS NOT NULL')

        result = cursor.fetchall()

        r.set(NAMESPACE+'bestblock', result[0][0])

        cursor.execute("SELECT EXTRACT(EPOCH FROM Min(ts) AT TIME ZONE 'UTC') as min_ts  \
                            FROM  blockheight_history \
                            WHERE blockheight IN ( SELECT MAX(blockheight) \
                            FROM blockheight_history )")

        result = cursor.fetchall()

        r.set(NAMESPACE+'lastblock', result[0][0])

        print(float(r.get('lastblock')))

        cursor.execute("SELECT avg(e.diff)  \
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
            LIMIT 40) e")

        result = cursor.fetchall()
        print(result[0][0].total_seconds())

        r.set(NAMESPACE+'blocktime', result[0][0].total_seconds())

        print(float(r.get('blocktime')))
        time.sleep(2)



