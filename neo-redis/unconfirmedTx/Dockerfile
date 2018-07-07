FROM python:3-alpine

RUN apk update \
  && apk add --virtual build-deps gcc python3-dev musl-dev \
  && apk add postgresql-dev \
  && pip install psycopg2 \
  && pip install redis \
  && apk del build-deps

WORKDIR /usr/src/app

COPY updateRedisUnconfirmedTx.py .

# start app
CMD ["python3", "updateRedisUnconfirmedTx.py"]