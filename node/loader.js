"use strict";

require('colors');
const site = process.argv[process.argv.length - 1];
const _modulename = process.argv[process.argv.length - 2];
const filename = `./site/${site}.json`;
const _module = require(`./modules/${_modulename}`);
var config = require(filename);
const fs = require('fs');
const http = require('http');
const url = require('url');

if ('number' === (typeof config.port) && !config.host) {
    config.host = 'localhost';
}

if ('number' !== typeof config.min) {
    config.min = 1;
}

var show = function (data) {
    if (data instanceof Error) {
        console.error(err);
    }
    else {
        if (data.status >= 500) {
            console.log(`${data.number} ${data.spend} ${data.status}`.yellow);
        }
        else if (data.status >= 400) {
            if (403 === data.status) {
                console.log(`${data.number} ${data.spend} ${data.status}`.magenta);
            }
            else {
                console.log(`${data.number} ${data.spend} ${data.status}`.red);
            }
        }
        else {
            console.log(`${data.number} ${data.spend} ${data.status}`);
        }
    }
};

function save() {
    if (!config) {
        return;
    }
    if (config.number > 0) {
        const i = config.number--;
        let start = Date.now();
        _module.request(config.url.replace('{number}', i), i)
            .then(function (data) {
                data.number = i;
                data.spend = (Date.now() - start) / 1000;
                show(data);
                save();
            })
            .catch(function (err) {
                console.error(err);
                save();
            });
    }
    else {
        process.exit();
    }
}

function run() {
    if ('function' === typeof _module.setup) {
        config.urlObject = url.parse(config.url);
        _module.setup(config);
    }
    for (var i = 0; i < config.threads; i++) {
        setTimeout(save, i * 1000);
    }
}

const clients = {};

const server = http.createServer(function (req, res) {
    switch (req.url) {
        case '/':
            res.writeHead(200, {
                'content-type': 'text/html'
            });
            res.end(fs.readFileSync(__dirname + '/index.html'));
            break;

        case '/about':
            res.writeHead(200, {
                'content-type': 'application/json'
            });
            res.end(JSON.stringify(config));
            break;

        case '/stream':
            const id = Date.now().toString(36);
            const onEnd = function () {
                delete clients[id];
            };
            req.on('aborted', onEnd);
            res.writeHead(200, {
                'content-type': 'text/event-stream',
                id: id
            });
            req.on('close', onEnd);
            req.on('finish', onEnd);
            clients[id] = res;
            break;

        default:
            res.writeHead(404);
            res.end();
            break;
    }
});

function send(event, data) {
    data = JSON.stringify(data);
    for(var time in clients) {
        clients[time].write(`event: ${event}\ndata: ${data}\n\n`);
    }
}

if ('number' === typeof config.port) {
    show = function (data) {
        if (data instanceof Error) {
            send('error', data);
        }
        else {
            send('complete', data);
        }
    };

    server.listen(config.port, config.host, function () {
        console.log(`Listen at http://${config.host}:${config.port}`);
        run();
    });
}
else {
    run();
}

function onExit() {
    if (config) {
        fs.writeFileSync(filename, JSON.stringify(config, null, "\t"));
        send('end', config);
        config = null;
    }
}

process.on('exit', onExit);
process.on('SIGINT', function () {
    onExit();
    process.exit();
});
