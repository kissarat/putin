const net = require('net');
const url = require('url');
const dns = require('dns');
const _ = require('underscore');

const threadsCount = +process.argv[process.argv.length - 3];
const _url = url.parse(process.argv[process.argv.length - 2]);
const maxNumber = +process.argv[process.argv.length - 1];
var requestsCount = 0;
var loadTimeSum = 0;
var loadDataAmount = 0;

function createRequest(path) {
  return`GET ${path} HTTP/1.1
Host: ${_url.hostname}

`;
}

dns.lookup(_url.hostname, {family: 4}, function (err, address) {
  function attack() {
    const start = Date.now();
    const socket = new net.Socket();
    socket.on('connect', function () {
      const number = _.random(1, maxNumber);
      const data = createRequest(_url.path.replace(/number/g, number.toString(10)));
      socket.write(data)
    });
    socket.on('error', function (err) {
      console.error(err.code);
    });
    socket.on('data', function (chuck) {
      loadDataAmount += chuck.length;
    });
    socket.on('end', function () {
      requestsCount++;
      loadTimeSum += Date.now() - start;
      attack();
    });
    socket.connect({
      host: address,
      port: 80
    });
  }

  if (err) {
    console.error(err)
  }
  else {
    for(let i = 0; i < threadsCount; i++) {
      attack();
    }
  }
});

setInterval(function () {
  const time = new Date().toLocaleString();
  const loading = Math.round(loadTimeSum / requestsCount);
  console.log(`# ${time} # ${loading} # ${requestsCount} / ${(loadDataAmount / 1024).toPrecision(4)}`);
  loadTimeSum = 0;
  requestsCount = 0;
  loadDataAmount = 0;
}, 10000);
