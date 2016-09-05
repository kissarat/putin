const url = require('url');
const jsdom = require('jsdom');
const constants = require('../list');
const _ = require('underscore');
const query = require('./db').query;

const except = constants.load(__dirname + '/except.list');

const tasks = [];

function run() {
  const task = tasks.shift();
  if (task) {
    task().then(run, function (err) {
      console.error(err);
      run();
    })
  }
}

function schedule(task) {
  tasks.push(task);
  if (tasks.length <= 1) {
    run();
  }
}

function crawl(path) {
  path = (path || '');
  return new Promise(function (resolve, reject) {
    jsdom.env({
      url: 'http://forum.ru-board.com/' + path,
      headers: {
        // cookie: 'amembernamecookie=kissarat; apasswordcookie=zvfyYf; tempcookie=d3550653e590b7c4d820f225ce0d81e3',
        'user-agent': constants.browser()
      },
      done: function (err, window) {
        if (err) {
          reject(err)
        }
        else {
          const document = window.document;
          const urls = Array
            .from(document.querySelectorAll('a[href]'))
            .map(a => url.parse(a.getAttribute('href')))
            .filter(_url => !except.some(pattern => 0 === _url.pathname.indexOf(pattern)));
          _.uniq(urls)
            .forEach(function (_url) {
            schedule(function () {
              let path = _url.pathname;
              if (_url.query) {
                path += '?' + _url.query
              }
              return query('SELECT insert_link($1::VARCHAR(256), $2)', [path.trim(), /forum.cgi/.test(path) ? 1 : 0])
            });
          });
          schedule(function () {
            return query('SELECT * FROM url WHERE crawled IS NULL ORDER BY priority DESC, RANDOM() LIMIT 1')
              .then(function (urls) {
                if (urls.length > 0) {
                  const path = urls[0].path;
                  return query('UPDATE url SET crawled = CURRENT_TIMESTAMP WHERE path = $1', [path])
                    .then(function () {
                      return crawl(path)
                    })
                }
                else {
                  process.exit();
                }
              })
          });
          resolve();
        }
      }
    })
  });
}

crawl();
