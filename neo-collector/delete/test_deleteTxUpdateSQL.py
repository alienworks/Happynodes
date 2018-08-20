import psycopg2
import time
import os
from deleteTxUpdateSQL import CONNECTION_STR, DELETE_SCRIPT, SLEEP_TIME
from deleteTxUpdateSQL import DeleteTxUpdateSQL


fake_tx_id = 0
fake_last_blockheight = 0
fake_endpoint_id = 1
fake_tx="0x9aeb3fe5ee94736c93eecd5013fdcde211c78e785247729c46897d5cd0fd1523"

def test_delete_update():
    # setup
    conn = psycopg2.connect(CONNECTION_STR)
    cursor = conn.cursor()
    cursor.execute("""INSERT INTO unconfirmed_tx 
                        (id, last_blockheight, connection_id, tx) 
                        VALUES (%s, %s, %s, %s)""", 
                        [fake_tx_id, fake_last_blockheight, fake_endpoint_id, fake_tx])
    conn.commit()

    conn = psycopg2.connect(CONNECTION_STR)
    cursor = conn.cursor()
    cursor.execute(DELETE_SCRIPT)
    conn.commit()

    cursor.execute("""SELECT * 
                FROM public.unconfirmed_tx 
                where id = %s""", 
                        [fake_tx_id])
    
    result = cursor.fetchall()
    print(result)

    assert len(result)==0

    cursor.close()
    conn.close()


    