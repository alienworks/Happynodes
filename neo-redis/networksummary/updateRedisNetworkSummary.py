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

GET_MAX_BLOCKHEIGHT_SQL = """SELECT max(blockheight)  
                        FROM  blockheight_history  
                        WHERE blockheight IS NOT NULL"""

GET_LASTBLOCK_TIME_SQL = """SELECT EXTRACT(EPOCH FROM Min(ts) AT TIME ZONE 'UTC') as min_ts  
                            FROM  blockheight_history 
                            WHERE blockheight IN ( SELECT MAX(blockheight) 
                            FROM blockheight_history )"""

GET_AVG_BLOCK_TIME_SQL = """SELECT avg(e.diff)  
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
                            LIMIT 40) e"""

if __name__ == "__main__":
    while True:
        r = redis.StrictRedis(
            host=redisHost, port=redisPort, db=redisDb)

        conn = psycopg2.connect(connection_str)

        cursor = conn.cursor()

        # cursor.execute(GET_MAX_BLOCKHEIGHT_SQL)

        # result = cursor.fetchall()

        # r.set(redisNamespace+'bestblock', result[0][0])

        cursor.execute(GET_LASTBLOCK_TIME_SQL)

        result = cursor.fetchall()

        r.set(redisNamespace+'lastblock', result[0][0])

        print(float(r.get(redisNamespace+'lastblock')))

        cursor.execute(GET_AVG_BLOCK_TIME_SQL)

        result = cursor.fetchall()
        print(result[0][0].total_seconds())

        r.set(redisNamespace+'blocktime', result[0][0].total_seconds())

        print(float(r.get(redisNamespace+'blocktime')))
        time.sleep(2)



