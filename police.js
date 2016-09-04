const jsdom = require('jsdom');
const request = require('request');
const _ = require('underscore');
const iconv = require('iconv-lite');
const http = require('http');
const fs = require('fs');
const qs = require('querystring');
const crypto = require('crypto');

const emails = ['gmail.com', 'yopmail.com', 'mail.ru', 'ukr.net'];

function readList(name) {
  return fs
    .readFileSync(__dirname + `/${name}.list`)
    .toString('utf8')
    .split('\n')
    .filter(line => line.trim())
}

function md5(data) {
  const hash = crypto.createHash('md5');
  hash.update(data);
  return hash.digest('hex');
}

const cities = readList('city');
const browsers = readList('browser');


jsdom.env({
  url: 'http://police-ua.com/register.php',
  done: function (err, window) {
    if (err) {
      return console.error(err)
    }
    const document = window.document;
    const $all = function (selector) {
      return document.querySelectorAll(selector);
    };
    const defaults = {};
    _.each($all('input, select'), function (input) {
      defaults[input.getAttribute('name')] = input.value;
    });
    const username = Date.now().toString(36);
    const email = username + '@' + _.sample(emails);
    const password = username + 'a4';
    const city = _.sample(cities);
    console.log(username, city);
    const fields = {
      username: username,
      password: password,
      passwordconfirm: password,
      email: email,
      emailconfirm: email,
      'humanverify[input]': 4,
      'humanverify[hash]': 'aadf1653f630ec10646287b857951f08',
      'userfield[field2]': 'Kiev',
      'userfield[field6]': 15,
      'userfield[field7]': 1,
      'userfield[field2_set]': 1,
      'userfield[field6_set]': 1,
      'userfield[field7_set]': 1,
      month: _.random(101, 112).toString().slice(-2),
      day: _.random(101, 130).toString().slice(-2),
      year: _.random(1970, 2010),
      dst: '2',
      'options[adminemail]': '1',
      'options[showemail]': '1',
      agree: '1',
      url: 'http://police-ua.com/',
      password_md5: md5(password),
      passwordconfirm_md5: md5(password),
      // Reset: 'Сброс',
      langid: '4',
      timezoneoffset: '2',
      s: ''
    };

    for (const key in fields) {
      if (!(key in fields)) {
        fields[key] = defaults[key];
      }
    }

    const req = http.request({
      host: 'police-ua.com',
      method: 'POST',
      path: 'register.php?do=addmember',
      headers: {
        'user-agent': _.sample(browsers),
        cookie: document.cookie
      }
    }, function (res) {
      const file = fs.createWriteStream('1.html');
      res.pipe(file)
    });

    req.on('aborted', function (err) {
      console.error(err);
    });

    const data = qs.encode(fields);
    console.log(data);
    req.write(data);
    req.end();
  }
});
