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
from insertDataSQL import callEndpoint, getLatency

url = "http://node2.sgp1.bridgeprotocol.io:10332"
wrong_url = "http://karlson.com:10332"

@pytest.mark.asyncio
async def test_callEndpoint_getblockcount():
    method = 'getblockcount'
    result = await callEndpoint(url, method)
    assert type(result["result"]) is int

@pytest.mark.asyncio
async def test_callEndpoint_getversion():
    method = 'getversion'
    result = await callEndpoint(url, method)
    assert 'nonce' in result["result"] and 'useragent' in result["result"] 

@pytest.mark.asyncio
async def test_callEndpoint_getconnectioncount():
    method = 'getconnectioncount'
    result = await callEndpoint(url, method)
    assert type(result["result"]) is int

@pytest.mark.asyncio
async def test_callEndpoint_getpeers():
    method = 'getpeers'
    result = await callEndpoint(url, method)
    assert 'connected' in result["result"] and 'bad' in result["result"] 

@pytest.mark.asyncio
async def test_getLatency():
    result = await getLatency(url)
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
    result = await updateEndpoint(url, 22)
    print(result)
    assert result==None


