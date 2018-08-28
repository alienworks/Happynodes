import psycopg2
import time
import os
from createUpdatePrimarySQL import CreateUpdatePrimarySQL, CONNECTION_STR, SLEEP_TIME


def check_mainnet_json(data):
    # Check if the mainnet has the correct key and structure that is expected
    if "sites" not in data or "name" not in data or "pollTime" not in data:
        return False

    for site in data["sites"]:
        if "url" not in site or "locale" not in site or "location" not in site or "type" not in site:
            return False
    return True


def test_get_coz_mainnet_json():
    createUpdatePrimarySQL = CreateUpdatePrimarySQL(CONNECTION_STR, SLEEP_TIME)
    coz_main_net_info = createUpdatePrimarySQL.get_coz_mainnet_json()
    assert check_mainnet_json(coz_main_net_info) == True

def test_get_existing_nodes():
    createUpdatePrimarySQL = CreateUpdatePrimarySQL(CONNECTION_STR, SLEEP_TIME)
    conn = psycopg2.connect(createUpdatePrimarySQL.connect_str)
    cursor = conn.cursor()

    existing_nodes = createUpdatePrimarySQL.get_existing_nodes(cursor)

    cursor.close()
    conn.close()

    # This nodes should definitely exist
    assert 'seed2.cityofzion.io' in existing_nodes


def test_create_or_update_nodes_rows():
    createUpdatePrimarySQL = CreateUpdatePrimarySQL(CONNECTION_STR, SLEEP_TIME)
    fake_mainnet = {
        "name": "MainNet",
        "pollTime": "5000",
                    "sites": [{
                        "protocol": "http",
                        "url": "fakenamer.com",
                        "location": "Hong Kong",
                        "locale": "hk",
                        "port": "10332",
                        "type": "RPC"
                    }]
    }

    createUpdatePrimarySQL.create_or_update_nodes_rows(fake_mainnet)

    conn = psycopg2.connect(CONNECTION_STR)
    cursor = conn.cursor()
    cursor.execute("""SELECT * 
                FROM public.nodes 
                where hostname = %s""", [fake_mainnet["sites"][0]["url"]])
    result = cursor.fetchall()
    
    assert len(result)==1

    cursor.execute("""UPDATE public.nodes 
                SET ip = %s
                where hostname = %s""", ["fake", 
                fake_mainnet["sites"][0]["url"]])
    conn.commit()

    cursor.execute("""SELECT * 
                FROM public.nodes 
                where hostname = %s""", [fake_mainnet["sites"][0]["url"]])
    resultAfterUpdate = cursor.fetchall()

    assert resultAfterUpdate[0][2]=="fake"

    createUpdatePrimarySQL.create_or_update_nodes_rows(fake_mainnet)

    cursor.execute("""SELECT * 
                FROM public.nodes 
                where hostname = %s""", [fake_mainnet["sites"][0]["url"]])
    result = cursor.fetchall()
    
    assert result[0][2]!="fake"
    
    cursor.execute("""DELETE
                FROM public.nodes 
                where hostname = %s""", [fake_mainnet["sites"][0]["url"]])
    conn.commit()
    cursor.close()
    conn.close()

def test_create_connectionendpoints_rows():
    createUpdatePrimarySQL = CreateUpdatePrimarySQL(CONNECTION_STR, SLEEP_TIME)
    fake_mainnet = {
        "name": "MainNet",
        "pollTime": "5000",
                    "sites": [{
                        "protocol": "http",
                        "url": "fakenamer.com",
                        "location": "Hong Kong",
                        "locale": "hk",
                        "port": "10332",
                        "type": "RPC"
                    }]
    }

    createUpdatePrimarySQL.create_or_update_nodes_rows(fake_mainnet)
    createUpdatePrimarySQL.create_connectionendpoints_rows(fake_mainnet)

    conn = psycopg2.connect(CONNECTION_STR)
    cursor = conn.cursor()

    cursor.execute("""SELECT * 
                    FROM public.connection_endpoints ce
                    inner join
                    public.nodes no 
                    on no.id=ce.node_id
                    where hostname = %s""", [fake_mainnet["sites"][0]["url"]])
    result = cursor.fetchall()

    assert len(result)==1

    # delete from coordinates
    cursor.execute("""DELETE
                FROM public.coordinates 
                where connection_id = (
                    select
                        ce.id
                    from
                        public.connection_endpoints ce
                    inner join public.nodes no on
                        no.id = ce.node_id where hostname = %s) """, 
                    [fake_mainnet["sites"][0]["url"]])

    # delete from locale
    cursor.execute("""DELETE
                FROM public.locale 
                where connection_id = (
                    select
                        ce.id
                    from
                        public.connection_endpoints ce
                    inner join public.nodes no on
                        no.id = ce.node_id where hostname = %s) """, 
                    [fake_mainnet["sites"][0]["url"]])

    # delete from locations
    cursor.execute("""DELETE
                FROM public.location 
                where connection_id = (
                    select
                        ce.id
                    from
                        public.connection_endpoints ce
                    inner join public.nodes no on
                        no.id = ce.node_id where hostname = %s) """, 
                    [fake_mainnet["sites"][0]["url"]])

    cursor.execute("""DELETE
                FROM public.connection_endpoints 
                where node_id = (
                    SELECT id FROM public.nodes where hostname = %s) """, 
                    [fake_mainnet["sites"][0]["url"]])

    cursor.execute("""DELETE
                FROM public.nodes 
                where hostname = %s""", 
                [fake_mainnet["sites"][0]["url"]])

    conn.commit()
    cursor.close()
    conn.close()

