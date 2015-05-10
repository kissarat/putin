from collections import deque
from datetime import datetime
from json import loads
from os import makedirs
from re import compile as regex, IGNORECASE
from random import random, choice
from signal import signal, SIGINT
from sys import argv
from threading import Thread, Lock
from time import sleep
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from os.path import isdir

with open('browsers', encoding='utf-8') as f:
    browsers = f.read().split('\n')

anchor_re = regex(r'<a.+href="/(ru/\d+/[^"]+)".*>.+</a>', IGNORECASE)
wget = {
    'User-Agent': 'Wget/1.16'
}


def gen_headers():
    global browsers
    return {
        'User-Agent': choice(browsers)
    }


class Job(Thread):
    threads = []
    encoding = 'utf8'
    threads_number = 40
    numbers = []
    work = True
    host = argv[1]
    root = 'http://%s/' % host
    archive = 'archive/' + host + '/'
    thread_number = None
    known = set()

    def __init__(self, *params):
        super().__init__(*params)

    def run(self):
        print('▨ ▨ start ' + self.name)
        archive = self.archive + str(self.thread_number)
        fails = open(archive + '.fail', 'a', encoding='utf-8')
        while self.work:
            try:
                try:
                    number = self.numbers.pop()
                except IndexError:
                    self.work = False
                    break
                start = datetime.now()
                url = self.root + argv[2] + str(number)
                r = urlopen(Request(url, headers=gen_headers()))
                data = r.read().decode(self.encoding, 'ignore')
                r.close()
                saved = 0
                anchors = anchor_re.findall(data)
                anchors = set(anchors)
                for a in anchors:
                    if a in self.known:
                        continue
                    a = self.root + a
                    with urlopen(Request('http://archive.org/wayback/available?url=' + a, headers=wget)) as r:
                        data = r.read().decode('utf8')
                    data = loads(data)
                    self.known.add(a)
                    if 'closest' not in data['archived_snapshots']:
                        with urlopen(Request('http://web.archive.org/save/' + a, headers=wget)) as r:
                            r.read()
                        saved += 1
                print('%s\t%s\t%s' % (number, saved if saved > 0 else '', int((datetime.now() - start).seconds/10) * '*'))
            except HTTPError as ex:
                if 502 == ex.code or 502 == ex.code:
                    fails.write(str(number) + '\n')
                if 404 != ex.code:
                    print('%s\t%s' % (number, ex.msg))
            except URLError as ex:
                print('URLError %s: %s' % (number, str(ex)))
                fails.write(str(number) + '\n')
            except ConnectionResetError as ex:
                print('URLError %s: %s' % (number, str(ex)))
                fails.write(str(number) + '\n')
        print('▨ stop ' + self.name)


def shutdown(sig, frame):
    Job.work = False

Job.numbers = list(range(1, int(argv[3])))
if not isdir(Job.archive):
    makedirs(Job.archive)

signal(SIGINT, shutdown)
for i in range(Job.threads_number):
    job = Job()
    job.thread_number = len(Job.threads)
    Job.threads.append(job)

for job in Job.threads:
    if not Job.work:
        break
    job.start()
    sleep(random() * 2)
