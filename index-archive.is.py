from urllib.parse import urlencode
from urllib.request import urlopen, Request
from re import compile as regex, IGNORECASE

snapshot_re = regex(r'(http://archive.is/\w+)', IGNORECASE)

# http://mysamaritanbug.samity.org/show_bug.cgi?id=
number = 13889
while True:
    data = urlencode({'url': 'http://novorossia.su/ru/node/%s' % number}).encode('ascii')
    with urlopen(Request('http://archive.is/submit/', method='POST', data=data,
                         headers={'Content-Type': 'application/x-www-form-urlencoded'})) as r:
        print('%s\t%s' % (number, snapshot_re.search(r.read().decode('utf-8')).group(1)))
    number -= 1
    if number <= 0:
        break
