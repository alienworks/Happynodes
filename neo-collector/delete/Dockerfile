FROM python:3.6-alpine

RUN apt-get update && apt-get install -y \
    postgresql \
    postgresql-contrib 

RUN pip3 install psycopg2

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

COPY deleteOldTx.py .

# start app
CMD ["python3", "deleteOldTx.py"]
