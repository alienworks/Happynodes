FROM python:3.6-alpine

# We need both "testing" and "community" repositories here.
RUN \
     echo "@testing http://nl.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories \
  && echo "@community http://nl.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories \
  && apk add --no-cache \
     git gcc musl-dev leveldb@testing leveldb-dev@testing 


RUN apk add --no-cache wget py-pip libressl-dev vim man

RUN git clone https://github.com/CityOfZion/neo-python.git
WORKDIR neo-python
RUN git checkout $branch

# Install the dependencies
RUN pip3 install -e .