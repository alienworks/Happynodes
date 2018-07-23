CREATE TABLE IF NOT EXISTS nodes (
    id bigserial PRIMARY key,
    hostname varchar(50) NOT null,
    ip varchar(50) NOT NULL
);


CREATE TABLE IF NOT EXISTS connection_endpoints (
    id bigserial PRIMARY key,
    node_id int8 REFERENCES nodes(id),
	protocol varchar(50) not null,
	port INT not NULL
);

CREATE TABLE IF NOT EXISTS coordinates (
    id bigserial PRIMARY key,
    connection_id INTEGER REFERENCES connection_endpoints(id),
    lat  INT,
    long  INT
);

CREATE TABLE IF NOT EXISTS port (
    id bigserial PRIMARY key,
    connection_id INTEGER REFERENCES connection_endpoints(id),
    port INT NOT NULL
);

CREATE TABLE IF NOT EXISTS version_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	connection_id INTEGER REFERENCES connection_endpoints(id) , 
	version varchar(50)
);

CREATE TABLE IF NOT EXISTS blockheight_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	connection_id INTEGER REFERENCES connection_endpoints(id) , 
	blockheight INTEGER
);

CREATE TABLE IF NOT EXISTS latency_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	connection_id INTEGER REFERENCES connection_endpoints(id) , 
	latency_history FLOAT
);

CREATE TABLE IF NOT EXISTS mempool_size_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	connection_id INTEGER REFERENCES connection_endpoints(id) , 
	mempool_size INTEGER
);

CREATE TABLE IF NOT EXISTS connection_counts_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	connection_id INTEGER REFERENCES connection_endpoints(id) , 
	connection_counts INTEGER
);


CREATE TABLE IF NOT EXISTS validated_connection_counts_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	connection_id INTEGER REFERENCES connection_endpoints(id) , 
	connection_counts INTEGER
);

CREATE TABLE IF NOT EXISTS online_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	connection_id INTEGER REFERENCES connection_endpoints(id) , 
	online boolean
);

CREATE TABLE IF NOT EXISTS rpc_http_status_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	connection_id INTEGER REFERENCES connection_endpoints(id) , 
	rpc_http_status boolean);

CREATE TABLE IF NOT EXISTS rpc_https_status_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	connection_id INTEGER REFERENCES connection_endpoints(id) , 
	rpc_https_status boolean);

CREATE TABLE IF NOT EXISTS locale (
    id bigserial PRIMARY key,
    connection_id INTEGER REFERENCES connection_endpoints(id),
    locale varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS location (
    id bigserial PRIMARY key,
    connection_id INTEGER REFERENCES connection_endpoints(id),
    location varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS ip (
    id bigserial PRIMARY key,
    connection_id INTEGER REFERENCES connection_endpoints(id),
    ip varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS edges (
    id bigserial PRIMARY key,
    connection_id_1 INTEGER REFERENCES connection_endpoints(id),
    connection_id_2 INTEGER REFERENCES connection_endpoints(id)
);

CREATE TABLE IF NOT EXISTS protocol (
    id bigserial PRIMARY key,
    connection_id INTEGER REFERENCES connection_endpoints(id),
    protocol varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS validated_peers_counts_history (
	id serial PRIMARY KEY, 
	ts TIMESTAMP WITHOUT TIME zone, 
	connection_id INTEGER REFERENCES connection_endpoints(id) , 
	validated_peers_counts INTEGER
);

CREATE TABLE IF NOT EXISTS unconfirmed_tx (
    id bigserial PRIMARY key,
    last_blockheight INTEGER not null,
    connection_id INTEGER REFERENCES connection_endpoints(id),
    tx varchar(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS validated_peers_history (
    id bigserial PRIMARY key,
	ts TIMESTAMP WITHOUT TIME zone, 
    connection_id INTEGER REFERENCES connection_endpoints(id),
    validated_peers_connection_id INTEGER REFERENCES connection_endpoints(id)
);

CREATE TABLE IF NOT EXISTS p2p_tcp_status_history (
    id bigserial PRIMARY key,
    ts TIMESTAMP WITHOUT TIME zone, 
    connection_id INTEGER REFERENCES connection_endpoints(id),
    p2p_tcp_status BOOLEAN
);

CREATE TABLE IF NOT EXISTS p2p_ws_status_history (
    id bigserial PRIMARY key,
    ts TIMESTAMP WITHOUT TIME zone, 
    connection_id INTEGER REFERENCES connection_endpoints(id),
    p2p_ws_status BOOLEAN
);



DROP TABLE port;
DROP TABLE version_history;
DROP TABLE blockheight_history;
DROP TABLE latency_history;
DROP TABLE mempool_size_history;
DROP TABLE connection_counts_history;
DROP TABLE online_history;
DROP TABLE rpc_http_status_history;
DROP TABLE rpc_https_status_history;
DROP TABLE edges;
DROP TABLE ip;
DROP TABLE locale;
DROP TABLE location;
DROP TABLE protocol;
DROP TABLE unconfirmed_tx;


DROP TABLE coordinates;
DROP TABLE disagreements;
DROP TABLE p2p_tcp_status_history;
DROP TABLE p2p_ws_status_history;
DROP TABLE validated_peers_history
DROP TABLE validated_peers_counts_history


DROP TABLE nodes;
DROP TABLE connection_endpoints