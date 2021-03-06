const request = require('request');
const fs = require('fs');
const qs = require('querystring');
const _ = require('underscore');

const images = [
  'https://cont.ws/uploads/pic/2015/12/123859.jpg',
  'http://dfpays.com/imagecache/g1264-ValentinJD-2D/main.jpg',
  'http://redixxmen.com/wp-content/uploads/2015/11/DSC_0342.jpg',
  'http://1gays.net/wp-content/uploads/2015/10/solo-twink-sporty-dildo.jpg',
  'http://www.manhuntdaily.com/files/2014/12/Anthony-gets-fucked-by-Cole-and-Hunter-in-a-bareback-threesome-for-gay-porn-site-Maverick-Men-5.jpg'
];

const headers = {
  'user-agent': ' Googlebot/2.1 (+http://www.google.com/bot.html)',
  accept: 'text/html',
  referer: 'http://antiukrop.su/to_send_data'
};

var count = 0;

function imageFileName(i) {
  return `/tmp/putin-${i}.jpg`;
}

function timeId() {
  const now = process.hrtime();
  return (now[0] * 1000 * 1000 * 1000 + now[1]).toString(36)
}

function downloadImage(image, i) {
  const filename = imageFileName(i);
  return new Promise(function (resolve, reject) {
    fs.access(filename, fs.constants.R_OK, function (err) {
      if (err && 'ENOENT' === err.code) {
        request(image, function (err, res) {
          if (err || 200 !== res.statusCode) {
            reject(err || res.statusCode, image)
          }
        })
          .pipe(fs.createWriteStream(filename))
          .on('close', function () {
            console.log(image);
            resolve(image)
          })
      }
      else if (err) {
        reject(err)
      }
      else {
        resolve(image);
      }
    });
  })
}

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

function loadSendPage() {
  return new Promise(function (resolve, reject) {
    request(headers.referer, {headers: headers}, function (err, res, data) {
      if (err || 200 !== res.statusCode) {
        reject(err || res.statusCode)
      }
      else {
        const r = /name="([^"]+)[^>]+value="([^"]+)"/g;
        const form = {};
        let m;
        while (m = r.exec(data)) {
          form[m[1]] = m[2]
        }
        const cookies = {};
        parseCookies(res.headers['set-cookie'], cookies);
        resolve({
          form: form,
          cookies: cookies
        })
      }
    });
  });
}

const fileFieldNames = [
  'files[submitted__photo]',
  'files[submitted__photo2]',
  'files[submitted__3]',
  'files[submitted__4]',
  'files[submitted__5]'
];

function send() {
  return loadSendPage()
    .then(function (page) {
      fileFieldNames.forEach(function (name, i) {
        page.form[name] = fs.createReadStream(imageFileName(i))
      });
      page.form['submitted[last_name]'] = timeId();
      page.form['submitted[name]'] = timeId();
      const cookiesString = qs.encode(page.cookies, '; ');
      return new Promise(function (resolve, reject) {
        request.post(headers.referer, {
          formData: page.form,
          headers: _.extend({
            cookies: cookiesString
          }, headers)
        }, function (err, res, data) {
          if (err) {
            reject(err)
          }
          else {
            // if (200 === res.statusCode) {
            //   const file = fs.createWriteStream(`/tmp/${timeId()}.html`);
            //   file.write(data);
            // }
            resolve(res);
          }
        });
      });
    })
}

setInterval(function () {
  console.log(count + ' # ', new Date().toLocaleString());
  count = 0;
}, 60000);

function loop() {
  send()
    .then(function (res) {
      if (302 === res.statusCode) {
        count++;
        // console.log(res.statusCode);
        loop()
      }
      else if (200 === res.statusCode) {
        // console.log(res.statusCode);
        setTimeout(loop, 10000)
      }
      else {
        console.log(res.statusCode);
        setTimeout(loop, 10000)
      }
    })
    .catch(function (err) {
      console.err(err);
      loop()
    })
}

Promise.all(images.map(downloadImage))
  .then(function () {
    for(let i = 0; i < 4; i++) {
      setTimeout(loop, i * 1000)
    }
  })
  .catch(function (err) {
    console.error(err);
  });
