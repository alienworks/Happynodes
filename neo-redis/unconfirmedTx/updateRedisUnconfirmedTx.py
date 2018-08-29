import redis
import psycopg2
import time
import os
import json
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

UNCONFIRMED_TX_SQL = """select
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
                                    min(connection_id) as connection_id,
                                    count(connection_id) as node_count,
                                    tx,
                                    max(last_blockheight) as last_blockheight
                                from
                                    public.unconfirmed_tx
                                where
                                    last_blockheight = (
                                        select
                                            max(blockheight)
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
                            n.id = ce.node_id
                        where node_count>1"""

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

        t0 = time.time()
        cursor.execute(UNCONFIRMED_TX_SQL)
        
        result = cursor.fetchall()
        t1 = time.time()
        logger.info('{} Took {} ms'.format('SQL ', (1000*(t1-t0))))
        logger.info("len(result) {}".format(len(result)))

        txs = []

        for unconfirmed_tx in result:
            tx = {"connection_id": unconfirmed_tx[0],
                "protocol": unconfirmed_tx[1],
                "hostname": unconfirmed_tx[2],
                "port": unconfirmed_tx[3],
                "node_count": unconfirmed_tx[4],
                "tx": unconfirmed_tx[5],
                "last_blockheight": unconfirmed_tx[6]
                }
            txs.append(tx)
        unconfirmed_txs = {"txs": txs}

        r.set(redisNamespace+'unconfirmed', json.dumps(unconfirmed_txs))
        time.sleep(2)

