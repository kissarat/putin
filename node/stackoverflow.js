const jsdom = require('jsdom');
const request = require('request');
const _ = require('underscore');
const http = require('http');
const fs = require('fs');
const qs = require('querystring');

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

var i = 948;
var lock = false;
var k = 0;
const maxThreads = 48;

function save() {
  if (queue.length < 100 && !lock) {
    lock = true;
    page(++i)
      .then(function (urls) {
        urls.forEach(function (url) {
          queue.push(url);
        });
        console.log('\t\t' + i);
        lock = false;
        save()
      })
      .catch(function (err) {
        console.error(err);
        lock = false;
        save()
      })
  }
  else {
    for (; k < maxThreads; k++) {
      const url = queue.shift();
      const timeout = _.random(0, (maxThreads - 5 - k) * 10);
      setTimeout(request, timeout >= 0 ? timeout : 0, 'https://web.archive.org/save/' + url, function (err, response) {
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
        save()
      })
    }
  }
}

save();
