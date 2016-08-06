"use strict";

require('colors');
const request = require('request');
const config = require(`./site/${process.argv[process.argv.length - 1]}.json`);

console.log(config);

function save(number) {
    if (number > 0) {
        let url = 'http://web.archive.org/save/' + config.url.replace('{number}', number);
        let start = Date.now();
        request(url, function (err, response, data) {
            if (err) {
                console.error(err);
            }
            else {
                let status = response.statusCode;
                let time = (Date.now() - start) / 1000;
                if (status >= 500) {
                    console.log(`${number} ${time} ${status}`.yellow);
                }
                else if (status >= 400) {
                    if (403 === status) {
                        console.log(`${number} ${time} ${status}`.magenta);
                    }
                    else {
                        console.log(`${number} ${time} ${status}`.red);
                    }
                }
                else {
                    console.log(`${number} ${time} ${status}`);
                }
            }
            number -= config.threads;
            save(number);
        })
    }
}

for (var i = 0; i < config.threads; i++) {
    setTimeout(save, i * 1000, config.number - i);
}
