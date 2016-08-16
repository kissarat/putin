const fs = require('fs');
const http = require('http');
const parse = require('url').parse;

var config;

module.exports = {
    setup: function (_config) {
        _config.dirname = __dirname + '/../../download/' + _config.urlObject.hostname;
        fs.mkdirSync(_config.dirname);
        config = _config;
    },

    request: function (url, i) {
        return new Promise(function (resolve, reject) {
            const req = http.get(parse(url), function (res) {
                const filename = config.dirname + `/${i}.${config.ext}`;
                const writer = fs.createWriteStream(filename);
                res.pipe(writer);
                res.on('end', function () {
                    resolve({
                        status: res.statusCode
                    });
                })
            });
            req.on('error', reject);
        });
    }
};
