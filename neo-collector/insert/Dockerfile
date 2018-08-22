FROM python:3.6-alpine

RUN apk update && \
 apk add postgresql-libs && \
 apk add --virtual .build-deps gcc musl-dev postgresql-dev && \
 python3 -m pip install psycopg2 --no-cache-dir && \
 python3 -m pip install requests --no-cache-dir && \
 python3 -m pip install dnspython --no-cache-dir && \
 python3 -m pip install aiohttp --no-cache-dir && \
 python3 -m pip install redis --no-cache-dir && \
 apk --purge del .build-deps

RUN mkdir /usr/src/app

WORKDIR /usr/src/app

COPY insertDataSQL.py .

RUN pip3 install redis

# start app
CMD ["python3", "insertDataSQL.py"]
