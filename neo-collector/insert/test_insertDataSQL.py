import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool
import requests
import json
import time
import datetime
import random
import os
import aiohttp
import asyncio
import asyncio
import ssl
import logging
import pytest
from insertDataSQL import callEndpoint, getLatency, updateEndpoint, getEndpointsList, getIpToEndpointMap
from insertDataSQL import GET_ENDPOINTS_SQL, GET_ENDPOINTS_IP_SQL

url = "http://node2.sgp1.bridgeprotocol.io:10332"
wrong_url = "http://karlson.com:10332"

@pytest.mark.asyncio
async def test_callEndpoint_getblockcount():
    method = 'getblockcount'
    ts, result = await callEndpoint(url, method)
    assert type(result["result"]) is int

@pytest.mark.asyncio
async def test_callEndpoint_getversion():
    method = 'getversion'
    ts, result = await callEndpoint(url, method)
    assert 'nonce' in result["result"] and 'useragent' in result["result"] 

@pytest.mark.asyncio
async def test_callEndpoint_getconnectioncount():
    method = 'getconnectioncount'
    ts, result = await callEndpoint(url, method)
    assert type(result["result"]) is int

@pytest.mark.asyncio
async def test_callEndpoint_getpeers():
    method = 'getpeers'
    ts, result = await callEndpoint(url, method)
    assert 'connected' in result["result"] and 'bad' in result["result"] 

@pytest.mark.asyncio
async def test_getLatency():
    ts, result = await getLatency(url)
    assert type(result) is int or type(result) is float 

@pytest.mark.asyncio
async def test_callEndpoint_badurl():
    method = 'getblockcount'
    result = await callEndpoint(wrong_url, method)
    assert result==None

@pytest.mark.asyncio
async def test_getLatency_badurl():
    result = await getLatency(wrong_url)
    assert result==None

@pytest.mark.asyncio
async def test_update():
    connectionId, latencyResult, blockcountResult, versionResult, connectioncountResult,\
                rawmempoolResult, peersResult, rpc_https_service, rpc_http_service = await updateEndpoint(url, 22)
    assert connectionId==22

    if latencyResult!=None:
        ts, result = await getLatency(url)
        assert type(result) is int or type(result) is float 

def test_getEndpointsList():
    result = getEndpointsList(GET_ENDPOINTS_SQL + " LIMIT 10")
    print(result)
    assert False

def test_getIpToEndpointMap():
    result = getIpToEndpointMap(GET_ENDPOINTS_IP_SQL + " LIMIT 10")
    print(result)
    assert False
    


