const jsdom = require('jsdom');
const request = require('request');
const _ = require('underscore');
const Store = require('./store');

const store = new Store(__filename, 30000);
store.setDefaults({
  number: 0,
  queue: 100,
  threads: {
    max: 48,
    delta: 5,
    delay: 10
  }
});
const c = store.config;

const queue = [];

function page(number) {
  return new Promise(function (resolve, reject) {
    jsdom.env({
      url: `https://stackoverflow.com/questions?pagesize=50&page=${number}&sort=newest`,
      done: function (err, window) {
        if (err) {
          reject(err)
        }
        else {
          const document = window.document;

          const $all = function (selector) {
            return document.querySelectorAll(selector)
          };

          const urls = _.map($all('.question-hyperlink'), a => a.href);
          urls.sort();
          resolve(urls)
        }
      }
    })
  })
}

var i = c.number;
var lock = false;
var k = 0;

function save() {
  if (queue.length < c.queue && !lock && i <= 246862) {
    lock = true;
    page(++i)
      .then(function (urls) {
        urls.sort().forEach(function (url) {
          queue.push(url);
        });
        console.log('\t\t' + i);
        lock = false;
        c.number = i - Math.ceil(queue.length / urls.length);
        store.save();
        save()
      })
      .catch(function (err) {
        console.error(err);
        lock = false;
        save()
      });
  }
  else {
    for (; k < c.threads.max; k++) {
      const url = queue.shift();
      const timeout = _.random(0, (c.threads.max - c.threads.delta - k) * c.threads.delay);
      const archiveURL = 'https://web.archive.org/save/' + url;
      setTimeout(request, timeout >= 0 ? timeout : 0, archiveURL, function (err, response) {
        if (err) {
          console.error(err)
        }
        else {
          if (200 === response.statusCode) {
            console.log(response.statusCode, url)
          }
          else {
            console.log(response.statusCode)
          }
        }
        k--;
        if (response && 502 != response.statusCode) {
          save()
        }
      })
    }
  }
}

save();
