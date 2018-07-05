var express = require('express');
var router = express.Router();
var redis = require("redis")
var namespace = process.env.NAMESPACE

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});


router.get('/bestblock', function (req, res, next) {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB
    });
    const namespace = process.env.NAMESPACE
    client.get(namespace.concat("bestblock"), function (err, reply) {
        res.json({ bestblock: reply })
    });
});

router.get('/lastblock', function (req, res, next) {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB
    });
    const namespace = process.env.NAMESPACE
    client.get(namespace.concat("lastblock"), function (err, reply) {
        res.json({ lastblock: reply })
    });
});

router.get('/blocktime', function (req, res, next) {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB
    });
    const namespace = process.env.NAMESPACE
    client.get(namespace.concat("blocktime"), function (err, reply) {
        res.json({ blocktime: reply })
    });
});


router.get('/unconfirmed', function (req, res, next) {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB
    });
    const namespace = process.env.NAMESPACE
    client.get(namespace.concat("unconfirmed"), function (err, reply) {
        const txs = JSON.parse(reply);
        res.json(txs);
    });
});

router.get('/nodes', function (req, res, next) {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB
    });
    const namespace = process.env.NAMESPACE
    client.hgetall(namespace.concat("node"), function (err, reply) {
        let nodes = reply

        let online_asia_nodes = []
        let online_north_america_nodes = []
        let online_europe_nodes = []

        let offline_asia_nodes = []
        let offline_north_america_nodes = []
        let offline_europe_nodes = []

        for (var key in nodes) {
            let node = JSON.parse(nodes[key])
            console.log(node)
            if (node.online == true) {
                if (node.locale == "jp" || node.locale == "cn" || node.locale == "sg" || node.locale == "in" || node.locale == "au") {
                    online_asia_nodes.push(node)
                } else if (node.locale == "de" || node.locale == "gb" || node.locale == "nl") {
                    online_europe_nodes.push(node)
                } else if (node.locale == "us" || node.locale == "ca") {
                    online_north_america_nodes.push(node)
                }
            } else {
                if (node.locale == "jp" || node.locale == "cn" || node.locale == "sg" || node.locale == "in" || node.locale == "au") {
                    offline_asia_nodes.push(node);
                } else if (node.locale == "de" || node.locale == "gb" || node.locale == "nl") {
                    offline_europe_nodes.push(node);
                } else if (node.locale == "us" || node.locale == "ca") {
                    offline_north_america_nodes.push(node);
                }
            }
        }
        let online_nodes = { asia: online_asia_nodes, europe: online_europe_nodes, americas: online_north_america_nodes }
        let offline_nodes = { asia: offline_asia_nodes, europe: offline_europe_nodes, americas: offline_north_america_nodes }
        res.json({ online: online_nodes, offline: offline_nodes });
    });
});


router.get('/nodes/:node_id', function (req, res, next) {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB
    });
    const namespace = process.env.NAMESPACE
    client.hget(namespace.concat("node"), req.params.node_id, function (err, reply) {
        const txs = JSON.parse(reply);
        res.json(txs);
    });
});

router.get('/nodes/:node_id/validatedpeers', function (req, res, next) {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB
    });
    const namespace = process.env.NAMESPACE
    client.hget(namespace.concat("validatedpeers"), req.params.node_id, function (err, reply) {
        const validatedpeers = JSON.parse(reply);
        res.json(validatedpeers);
    });
});

router.get('/edges', function (req, res, next) {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB
    });
    const namespace = process.env.NAMESPACE
    client.get(namespace.concat("edges"), function (err, reply) {
        const edges = JSON.parse(reply);
        res.json(edges);
    });
});

router.get('/nodeslist', function (req, res, next) {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: process.env.REDIS_PORT,
        db: process.env.REDIS_DB
    });
    const namespace = process.env.NAMESPACE
    client.get(namespace.concat("nodeslist"), function (err, reply) {
        const edges = JSON.parse(reply);
        res.json(edges);
    });
});

module.exports = router;