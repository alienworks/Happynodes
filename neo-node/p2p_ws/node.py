import threading
from time import sleep

from logzero import logger
from twisted.internet import reactor, task

from neo.Network.NodeLeader import NodeLeader
from neo.Core.Blockchain import Blockchain
from neo.Implementations.Blockchains.LevelDB.LevelDBBlockchain import LevelDBBlockchain
from neo.Settings import settings
import dns.resolver
import socket
import os
import psycopg2
import time
import datetime

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(databasename, user, host, password)
dsn="postgresql://{}:{}@{}/{}".format(user, password, host, databasename)

def getSqlDateTime(ts):
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')

def getIpAddressMap(cursor):
    ip_dict = {}
    cursor.execute("select ce.id, nod.id, nod.hostname, nod.ip \
                    from connection_endpoints ce\
                    inner join nodes nod\
                    on nod.id=ce.node_id")
    results = cursor.fetchall()
    
    for result in results:
        address_id, ip_id, address, ip = result
        if ip not in ip_dict:
            ip_dict[ip] = [address_id]
        else:
            ip_dict[ip].append(address_id)
    return ip_dict

def custom_background_code(connection_str, ip_dict):
    """ Custom code run in a background thread.
    This function is run in a daemonized thread, which means it can be instantly killed at any
    moment, whenever the main thread quits. If you need more safety, don't use a daemonized
    thread and handle exiting this thread in another way (eg. with signals and events).
    """
    while True:
        conn = psycopg2.connect(connection_str)
        cursor = conn.cursor()
        logger.info("Block %s / %s", str(Blockchain.Default().Height), str(Blockchain.Default().HeaderHeight))
        print(len(NodeLeader.Instance().Peers))

        insert_time = time.time()
        if len(NodeLeader.Instance().Peers)>0:
            for peer in NodeLeader.Instance().Peers:

                print(peer.host)
                if peer.host in ip_dict:
                    address_list = ip_dict[peer.host]
                    for address_id in address_list:
                        cursor.execute("INSERT INTO p2p_ws_status_history (ts, connection_id, p2p_ws_status) VALUES (%s, %s, %s)", [getSqlDateTime(insert_time), address_id, True])
                else:
                    print("ip not in database")
        conn.commit()
        cursor.close()
        conn.close()
        sleep(15)


def main():
    conn = psycopg2.connect(connection_str)
    cursor = conn.cursor()
    ip_dict = getIpAddressMap(cursor)
    cursor.close()
    conn.close()

    # Use Custom config
    settings.setup("./config.json")
    settings.set_max_peers(500)

    # Setup the blockchain
    blockchain = LevelDBBlockchain(settings.chain_leveldb_path)
    Blockchain.RegisterBlockchain(blockchain)
    dbloop = task.LoopingCall(Blockchain.Default().PersistBlocks)
    dbloop.start(.1)
    NodeLeader.Instance().Start()

    # Start a thread with custom code
    d = threading.Thread(target=custom_background_code, args=(connection_str, ip_dict,))
    d.setDaemon(True)  # daemonizing the thread will kill it when the main thread is quit
    d.start()

    # Run all the things (blocking call)
    reactor.run()
    logger.info("Shutting down.")


if __name__ == "__main__":
    main()