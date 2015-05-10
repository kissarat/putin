from collections import deque
from datetime import datetime
from json import loads
from random import random, choice
from signal import signal, SIGINT
from sys import argv
from threading import Thread, Lock
from time import sleep
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

with open('browsers', encoding='utf-8') as f:
    browsers = f.read().split('\n')

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
    threads_number = 100
    work = True
    lock = Lock()
    number = int(argv[2])

    def __init__(self, *params):
        super().__init__(*params)

    @staticmethod
    def decrement():
        with Job.lock:
            number = Job.number
            Job.number -= 1
        return number

    def run(self):
        print('▨ ▨ start ' + self.name)
        fails = deque()
        loaded = 0
        saved = 0
        start = datetime.now()
        while self.work:
            try:
                if len(fails) > 0:
                    number = fails.pop()
                else:
                    number = self.decrement()
                    if number <= 0:
                        self.work = False
                        break
                    mod = Job.threads_number/8
                    if 0 == number % Job.threads_number:
                        saved = saved if saved > 0 else ''
                        time = round((datetime.now() - start).seconds/mod) * '*'
                        print('#%s %s\t%s\t%s' % (number, loaded, saved, time))
                        loaded = 0
                        saved = 0
                        sleep(random() * 24)
                        start = datetime.now()

                url = str(argv[1]) % number
                with urlopen(Request(url, headers=gen_headers())) as r:
                    r.read().decode(self.encoding, 'ignore')
                loaded += 1
                with urlopen(Request('http://archive.org/wayback/available?url=' + url, headers=wget)) as r:
                    data = r.read().decode('utf8')
                data = loads(data)
                if 'closest' not in data['archived_snapshots']:
                    with urlopen(Request('http://web.archive.org/save/' + url, headers=wget)) as r:
                        r.read()
                    saved += 1
            except HTTPError as ex:
                if 502 == ex.code or 502 == ex.code:
                    fails.appendleft(number)
                    print('URLError %s: %s' % (number, str(ex)))
                    sleep(random() * 4)
                if 404 != ex.code:
                    print('%s\t%s' % (number, ex.msg))
                    sleep(random())
            except URLError as ex:
                print('URLError %s: %s' % (number, str(ex)))
                fails.appendleft(number)
                sleep(random() * 6)
            except ConnectionResetError as ex:
                print('URLError %s: %s' % (number, str(ex)))
                fails.appendleft(number)
                sleep(random() * 8)
        print('▨ stop ' + self.name)


def shutdown(sig, frame):
    Job.work = False

signal(SIGINT, shutdown)
for i in range(Job.threads_number):
    job = Job()
    # job.thread_number = len(Job.threads)
    Job.threads.append(job)

for job in Job.threads:
    if not Job.work:
        break
    job.start()
    sleep(random() * 2)
