const fs = require('fs');
const http = require('http');
const parse = require('url').parse;

var config;

module.exports = {
    setup: function (_config) {
        _config.dirname = __dirname + '/../../download/' + (_config.name || _config.urlObject.hostname);
        fs.mkdirSync(_config.dirname);
        config = _config;
    },

    request: function (url, i, cb) {
        return new Promise(function (resolve, reject) {
            function request(url) {
                const req = http.get(parse(url), function (res) {
                    if (302 === res.statusCode) {
                        request(res.headers.location)
                    }
                    else {
                        const filename = config.dirname + `/${i}.${config.ext}`;
                        const writer = fs.createWriteStream(filename);
                        const size = +res.headers['content-length'];
                        let downloaded = 0;
                        res.pipe(writer);
                        res.on('data', function (chunk) {
                            downloaded += chunk.length;
                            cb({
                                total: size,
                                progress: downloaded
                            })
                        });
                        res.on('end', function () {
                            resolve({
                                status: res.statusCode
                            });
                        })
                    }
                });
                req.on('error', reject);
            }
            request(url)
        });
    }
};
