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

process.title = 'putin'

if ('number' === (typeof config.port) && !config.host) {
    config.host = 'localhost';
}

if ('number' !== typeof config.min) {
    config.min = 1;
}

const last = {};

var show = function (data) {
    if (data instanceof Error) {
        console.error(data);
    }
    else if ('number' === typeof data.progress) {
        if (!last[data.number]) {
            last[data.number] = Date.now();
        }
        if (Date.now() - last[data.number] > 2000) {
            const progress = new Array(Math.round(100 * data.progress / data.total)).join('#');
            const speed = Math.round((data.progress / 1024) / (data.spend / 1000));
            console.log(`${data.number} ${speed}\t${progress}`);
            last[data.number] = Date.now();
        }
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

function save(thread) {
    if (!config) {
        return;
    }
    if (config.number >= config.min) {
        const i = config.number--;
        const start = Date.now();
        const url = config.url
            .replace('{number}', i)
            .replace('{thread}', thread + 1);
        const cb = function (data) {
            data.number = i;
            data.spend = Date.now() - start;
            show(data)
        };
        _module.request(url, i, cb)
            .then(function (data) {
                data.number = i;
                data.spend = (Date.now() - start) / 1000;

                show(data);
                save(thread);
            })
            .catch(function (err) {
                console.error(err);
                save(thread);
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
        setTimeout(save, i * 1000, i);
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
