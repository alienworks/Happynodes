import redis
import psycopg2
import time
import os
import json

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

        cursor.execute('SELECT count(connection_id) as node_count, tx, max(last_blockheight) \
            FROM public.unconfirmed_tx  \
            where last_blockheight = (select max(blockheight) from blockheight_history)  \
            group by tx  \
            order by node_count desc')
        
        result = cursor.fetchall()
        print(result)

        txs = []

        for unconfirmed_tx in result:
            tx = {"node_count": unconfirmed_tx[0],
                "tx": unconfirmed_tx[1],
                "max": unconfirmed_tx[2]
                }
            txs.append(tx)
        unconfirmed_txs = {"txs": txs}

        r.set(redisNamespace+'unconfirmed', json.dumps(unconfirmed_txs))
        time.sleep(2)

