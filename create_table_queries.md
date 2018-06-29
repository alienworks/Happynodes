CREATE TABLE IF NOT EXISTS address (
    id bigserial PRIMARY key,
    address varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS port (
    id bigserial PRIMARY key,
    address_id INTEGER REFERENCES address(id),
    port INT NOT NULL
);

CREATE TABLE IF NOT EXISTS version_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	address_id INTEGER REFERENCES address(id) , 
	version varchar(50)
);

CREATE TABLE IF NOT EXISTS blockheight_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	address_id INTEGER REFERENCES address(id) , 
	blockheight INTEGER
);

CREATE TABLE IF NOT EXISTS latency_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	address_id INTEGER REFERENCES address(id) , 
	latency_history FLOAT
);

CREATE TABLE IF NOT EXISTS mempool_size_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	address_id INTEGER REFERENCES address(id) , 
	mempool_size INTEGER
);

CREATE TABLE IF NOT EXISTS connection_counts_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	address_id INTEGER REFERENCES address(id) , 
	connection_counts INTEGER
);


CREATE TABLE IF NOT EXISTS validated_connection_counts_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	address_id INTEGER REFERENCES address(id) , 
	connection_counts INTEGER
);

CREATE TABLE IF NOT EXISTS online_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	address_id INTEGER REFERENCES address(id) , 
	online boolean
);

CREATE TABLE IF NOT EXISTS rcp_http_status_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	address_id INTEGER REFERENCES address(id) , 
	rcp_http_status boolean);

CREATE TABLE IF NOT EXISTS rcp_https_status_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	address_id INTEGER REFERENCES address(id) , 
	rcp_https_status boolean);

CREATE TABLE IF NOT EXISTS locale (
    id bigserial PRIMARY key,
    address_id INTEGER REFERENCES address(id),
    locale varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS location (
    id bigserial PRIMARY key,
    address_id INTEGER REFERENCES address(id),
    location varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS ip (
    id bigserial PRIMARY key,
    address_id INTEGER REFERENCES address(id),
    ip varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS edges (
    id bigserial PRIMARY key,
    address_id_1 INTEGER REFERENCES address(id),
    address_id_2 INTEGER REFERENCES address(id)
);

CREATE TABLE IF NOT EXISTS protocol (
    id bigserial PRIMARY key,
    address_id INTEGER REFERENCES address(id),
    protocol varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS validated_peers_counts_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	address_id INTEGER REFERENCES address(id) , 
	validated_peers_counts INTEGER
);

CREATE TABLE IF NOT EXISTS unconfirmed_tx (
    id bigserial PRIMARY key,
    last_blockheight INTEGER not null,
    address_id INTEGER REFERENCES address(id),
    tx varchar(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS validated_peers_history (
    id bigserial PRIMARY key,
	ts TIMESTAMP WITHOUT TIME zone, 
    address_id INTEGER REFERENCES address(id),
    validated_peers_address_id INTEGER REFERENCES address(id)
);

CREATE TABLE IF NOT EXISTS p2p_tcp_status_history (
    id bigserial PRIMARY key,
    ts TIMESTAMP WITHOUT TIME zone, 
    address_id INTEGER REFERENCES address(id),
    p2p_tcp_status BOOLEAN
);

DROP TABLE port;
DROP TABLE version_history;
DROP TABLE blockheight_history;
DROP TABLE latency_history;
DROP TABLE mempool_size_history;
DROP TABLE connection_counts_history;
DROP TABLE online_history;
DROP TABLE rcp_http_status_history;
DROP TABLE rcp_https_status_history;
DROP TABLE edges;
DROP TABLE ip;
DROP TABLE locale;
DROP TABLE location;
DROP TABLE protocol;
DROP TABLE unconfirmed_tx;
DROP TABLE address;