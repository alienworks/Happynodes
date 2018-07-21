import psycopg2
import time
import os

host = str(os.environ['PGHOST'])
databasename = str(os.environ['PGDATABASE'])
user = str(os.environ['PGUSER'])
password = str(os.environ['PGPASSWORD'])

connection_str = "dbname='{}' user='{}' host='{}' password='{}'".format(databasename, user, host, password)

connect_str = connection_str

print(connect_str)

while True:
    conn = psycopg2.connect(connect_str)

    cursor = conn.cursor()

    print("delete tx")

    cursor.execute("""delete 
                    FROM unconfirmed_tx 
                    WHERE last_blockheight+10 < (SELECT max(blockheight)
                    FROM  blockheight_history 
                    WHERE blockheight IS NOT NULL)""")

    conn.commit()
    cursor.close()
    conn.close()

    print("Sleeping")
    # Run hourly
    time.sleep(60*60) 
