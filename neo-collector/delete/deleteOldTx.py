import psycopg2
from config import CONNECTION_STR
import time

connect_str = CONNECTION_STR

while True:
    conn = psycopg2.connect(connect_str)

    cursor = conn.cursor()

    print("delete tx")

    cursor.execute("delete \
    FROM unconfirmed_tx \
    WHERE last_blockheight+10 < (SELECT max(blockheight)\
    FROM  blockheight_history \
    WHERE blockheight IS NOT NULL)")

    conn.commit()
    cursor.close()
    conn.close()

    print("Sleeping")
    # Run hourly
    time.sleep(60*60) 
