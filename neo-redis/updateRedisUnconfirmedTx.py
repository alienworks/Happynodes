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

        cursor.execute('SELECT count(address_id) as node_count, tx, max(last_blockheight) \
            FROM public.unconfirmed_tx \
            where last_blockheight = (select max(blockheight) from blockheight_history) \
            group by tx \
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

        r.set(NAMESPACE+'unconfirmed', json.dumps(unconfirmed_txs))
        time.sleep(2)

