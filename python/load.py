from json import load, dump
from sys import argv
from urllib.request import urlopen, Request
from re import compile as regex, IGNORECASE

cookie_re = regex(r'^([^=]+)=([^;]+);', IGNORECASE)
antiddos_re = regex(r'_ddn_intercept_2_=([^;]+);', IGNORECASE)

host = argv[1]
config_file = 'config/%s.json' % host
with open(config_file, encoding='utf-8') as f:
    config = load(f)

headers = config['headers'].copy()
headers['User-Agent'] = 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1478.0 Safari/537.36'
cookies = config['cookies']
headers['Cookie'] = '; '.join('%s=%s' % (k, cookies[k]) for k in cookies)

with urlopen(Request('http://%s/%s' % (host, argv[2]), headers=headers)) as r:
    r_headers = r.getheaders()
    for header in r_headers:
        if 'Set-Cookie' == header[0]:
            cookie = cookie_re.search(header[1])
            cookies[cookie.group(1)] = cookie.group(2)
        print('%s: %s' % header)
    data = r.read()
    page = data.decode('utf-8')
    cookie = antiddos_re.search(page)
    if cookie:
        cookies['_ddn_intercept_2_'] = cookie.group(1)
    with open('archive/1.html', 'wb') as f:
        f.write(data)
    with open(config_file, 'w', encoding='utf-8') as f:
        dump(config, f, indent='\t')
