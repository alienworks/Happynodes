import psycopg2
import time
import os

PGHOST = str(os.environ['PGHOST'])
PGDATABASE = str(os.environ['PGDATABASE'])
PGUSER = str(os.environ['PGUSER'])
PGPASSWORD = str(os.environ['PGPASSWORD'])

CONNECTION_STR = "dbname='{}' user='{}' host='{}' password='{}'".format(PGDATABASE, PGUSER, PGHOST, PGPASSWORD)


DELETE_SCRIPT = """DELETE 
                    FROM unconfirmed_tx 
                    WHERE last_blockheight+10 < (SELECT max(blockheight)
                    FROM  blockheight_history 
                    WHERE blockheight IS NOT NULL)"""

SLEEP_TIME = 60*60

class DeleteTxUpdateSQL:
    def __init__(self, connect_str, sql_query, sleeptime):
        self.connect_str=connect_str
        self.sql_query = sql_query
        self.sleeptime = sleeptime

    def run(self):
        while True:
            self.update()

            print("Sleeping")
            # Run hourly
            time.sleep(self.sleeptime) 
    
    def update(self):
        self.conn = psycopg2.connect(self.connect_str)
        self.cursor = self.conn.cursor()

        self.cursor.execute(self.sql_query)

        self.conn.commit()
        self.cursor.close()
        self.conn.close()

if __name__ == "__main__":
    deleteTxUpdate = DeleteTxUpdateSQL(CONNECTION_STR, DELETE_SCRIPT, SLEEP_TIME)
    deleteTxUpdate.run()

