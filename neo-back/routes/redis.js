var express = require('express');
var router = express.Router();
var redis = require("redis")

// Global (Avoids Duplicate Connections)
var redisClient = null;


// Make the below functions as private
function openRedisConnection() {
    if (redisClient && redisClient.connected)
        return redisClient;

    if (redisClient)
        redisClient.end(); // End and open once more

    redisClient = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        //password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB
    });
    return redisClient;
}

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});


router.get('/bestblock', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.get(namespace.concat("bestblock"), function (err, reply) {
        res.json({ bestblock: reply })
    });
});

router.get('/lastblock', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.get(namespace.concat("lastblock"), function (err, reply) {
        res.json({ lastblock: reply })
    });
});

router.get('/blocktime', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.get(namespace.concat("blocktime"), function (err, reply) {
        res.json({ blocktime: reply })
    });
});


router.get('/unconfirmed', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.get(namespace.concat("unconfirmed"), function (err, reply) {
        const txs = JSON.parse(reply);
        res.json(txs);
    });
});

router.get('/nodes_flat', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.hgetall(namespace.concat("node"), function (err, reply) {
        let nodes = Object.values(reply).sort((a,b)=>{return JSON.parse(b).health_score - JSON.parse(a).health_score})
        res.json(nodes.map(a=>JSON.parse(a)));

    });
});

router.get('/nodes', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.hgetall(namespace.concat("node"), function (err, reply) {
        
        let nodes = Object.values(reply).sort((a,b)=>{return JSON.parse(b).health_score - JSON.parse(a).health_score})

        let online_asia_nodes = []
        let online_north_america_nodes = []
        let online_europe_nodes = []

        let offline_asia_nodes = []
        let offline_north_america_nodes = []
        let offline_europe_nodes = []

        for (var index in nodes) {
            let node = JSON.parse(nodes[index])
            if (node.online == true) {

                if (node.locale == "jp" || node.locale == "kr" || node.locale == "cn" || node.locale == "sg" || node.locale == "in" || node.locale == "au") {
                    online_asia_nodes.push(node)
                } else if (node.locale == "de" || node.locale == "ch" || node.locale == "gb" || node.locale == "nl") {
                    online_europe_nodes.push(node)
                } else if (node.locale == "us" || node.locale == "br" || node.locale == "ca") {
                    online_north_america_nodes.push(node)
                }
            } else {
                if (node.locale == "jp" || node.locale == "kr" || node.locale == "cn" || node.locale == "sg" || node.locale == "in" || node.locale == "au") {
                    offline_asia_nodes.push(node);
                } else if (node.locale == "de" || node.locale == "ch" || node.locale == "gb" || node.locale == "nl") {
                    offline_europe_nodes.push(node);
                } else if (node.locale == "us" || node.locale == "br" || node.locale == "ca") {
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
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.hget(namespace.concat("node"), req.params.node_id, function (err, reply) {
        const txs = JSON.parse(reply);
        if (txs === null){
            res.json({txs:[]});
        } else {
            res.json(txs);
        }
    });
});

router.get('/nodes/:node_id/validatedpeers', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.hget(namespace.concat("validatedpeers"), req.params.node_id, function (err, reply) {
        const validatedpeers = JSON.parse(reply);
        if (validatedpeers === null){
            res.json([]);
        } else {
            res.json(validatedpeers);
        }
    });
});

router.get('/edges', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.get(namespace.concat("edges"), function (err, reply) {
        const edges = JSON.parse(reply);
        res.json(edges);
    });
});

router.get('/nodeslist', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.get(namespace.concat("nodeslist"), function (err, reply) {
        const edges = JSON.parse(reply);
        res.json(edges);
    });
});

router.get('/historic/network/size/daily', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.hgetall(namespace.concat("nodes_online_daily"), function (err, reply) {
        var data_list = []
        for (var key in reply) {
            var data = JSON.parse(reply[key]);
            data_list.push({date:key, totalonline:data.totalonline, total:data.total})
        }
        res.json({data:data_list});
    });
});

router.get('/historic/network/size/weekly', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.hgetall(namespace.concat("nodes_online_weekly"), function (err, reply) {
        var data_list = []
        for (var key in reply) {
            var data = JSON.parse(reply[key]);
            data_list.push({date:key, totalonline:data.totalonline, total:data.total})
        }
        res.json({data:data_list});
    });
});

router.get('/historic/node/stability/daily/:node_id', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.hget(namespace.concat("node_stability_daily"), req.params.node_id.toString(), function (err, reply) {
        console.log(reply)
        res.json({reply});
    });
});

router.get('/historic/node/stability/weekly/:node_id', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.hget(namespace.concat("node_stability_weekly"), req.params.node_id.toString(), function (err, reply) {
        console.log(reply)
        res.json({reply});
    });
});

router.get('/historic/node/latency/daily/:node_id', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.hget(namespace.concat("node_latency_daily"), req.params.node_id.toString(), function (err, reply) {
        console.log(reply)
        res.json({reply});
    });
});

router.get('/historic/node/latency/weekly/:node_id', function (req, res, next) {
    const client = openRedisConnection();
    const namespace = process.env.REDIS_NAMESPACE
    client.hget(namespace.concat("node_latency_weekly"), req.params.node_id.toString(), function (err, reply) {
        console.log(reply)
        res.json({reply});
    });
});

module.exports = router;
