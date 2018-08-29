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
        r=None
        if "REDIS_PASS" in os.environ:
            # Testing locally
            r = redis.StrictRedis(
                host=redisHost, port=redisPort, 
                db=redisDb, 
                password=redisPass)
        else:
            r = redis.StrictRedis(
                host=redisHost, 
                port=redisPort, 
                db=redisDb)

        conn = psycopg2.connect(connection_str)

        cursor = conn.cursor()

        cursor.execute(GET_MAX_BLOCKHEIGHT_SQL)

        result = cursor.fetchall()

        r.set(redisNamespace+'bestblock', 
            result[0][0])
        
        logger.info("bestblock")
        logger.info((r.get(redisNamespace+'bestblock')))

        cursor.execute(GET_LASTBLOCK_TIME_SQL)

        result = cursor.fetchall()

        r.set(redisNamespace+'lastblock', 
            result[0][0])

        logger.info("lastblock")
        logger.info(float(r.get(redisNamespace+'lastblock')))

        cursor.execute(GET_AVG_BLOCK_TIME_SQL)

        result = cursor.fetchall()
        logger.info("blocktime")

        r.set(redisNamespace+'blocktime', 
            result[0][0].total_seconds())

        logger.info(float(r.get(redisNamespace+'blocktime')))
        time.sleep(1)



