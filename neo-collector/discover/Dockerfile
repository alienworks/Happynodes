FROM cityofzion/neo-python

RUN apt-get update && apt-get install -y \
    postgresql \
    postgresql-contrib 

RUN pip3 install psycopg2

RUN pip3 install dnspython

RUN mkdir /usr/src/app

WORKDIR /usr/src/app

COPY Client.py .

COPY discover.py .

# start app
CMD ["python3", "discover.py"]
