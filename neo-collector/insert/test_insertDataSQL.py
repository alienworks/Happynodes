from neorpc.Settings import SettingsHolder
from Client import RPCClient, RPCEndpoint
import psycopg2
import requests
import json
import time
import datetime
import queue
import threading
import random
from psycopg2.pool import ThreadedConnectionPool
import os
import redis
import dns.resolver
import aiohttp
import asyncio
import time
import pytest
from insertDataSQL import callEndpoint, getLatency

url = "http://node2.sgp1.bridgeprotocol.io:10332"

@pytest.mark.asyncio
async def test_callEndpoint_getblockcount():
    method = 'getblockcount'
    result = await callEndpoint(url, method)
    result=json.loads(result)
    assert type(result["result"]) is int

@pytest.mark.asyncio
async def test_callEndpoint_getversion():
    method = 'getversion'
    result = await callEndpoint(url, method)
    result=json.loads(result)
    print(result)
    assert 'nonce' in result["result"] and 'useragent' in result["result"] 


@pytest.mark.asyncio
async def test_callEndpoint_getconnectioncount():
    method = 'getconnectioncount'
    result = await callEndpoint(url, method)
    result=json.loads(result)
    assert type(result["result"]) is int

@pytest.mark.asyncio
async def test_callEndpoint_getpeers():
    method = 'getpeers'
    result = await callEndpoint(url, method)
    result=json.loads(result)
    print(result)
    assert 'connected' in result["result"] and 'bad' in result["result"] 

@pytest.mark.asyncio
async def test_getLatency():
    result = await getLatency(url)
    assert type(result) is int or type(result) is float 


