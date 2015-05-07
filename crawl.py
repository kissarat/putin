from binascii import crc32
from collections import deque
from datetime import datetime
from os import makedirs
from os.path import isfile, isdir
from queue import Queue
from random import random, choice
from re import compile as regex, IGNORECASE
from signal import signal, SIGINT
from sys import argv
from threading import Thread
from time import sleep
from urllib.error import HTTPError
from urllib.request import urlopen, Request
from piston_mini_client import SocketError

with open('browsers', encoding='utf-8') as f:
    browsers = f.read().split('\n')


class Crawler(Thread):
    work = False
    threads = []
    threads_number = 36
    host = argv[1]
    root = 'http://%s/' % host
    archive = 'archive/' + host + '/'
    wait_count = 0
    busy_wait = 0

    @staticmethod
    def crawl():
        Crawler.work = True
        for i in range(Crawler.threads_number):
            Crawler.threads.append(Crawler())
        Crawler.schedule('')
        for crawler in Crawler.threads:
            crawler.start()
            sleep(random() * 4)

    def __init__(self, *params):
        super().__init__(*params)
        self.queue = deque([])
        self.list = []
        self.file = None
        self.queue_filename = None
        self.snooze_summary = 0
        self.last = datetime.now()

    def run(self):
        number = self.threads.index(self)
        self.name = 'T' + str(number + 1)
        filename = self.archive + str(number)
        self.queue_filename = filename + '.queue'
        self.list = self.load_list(filename)
        self.queue = deque(self.load_list(self.queue_filename) + list(self.queue))
        self.file = open(filename, 'a')
        print('▨ ▨ start ' + self.name)
        while self.work:
            try:
                self.request()
            except Exception as ex:
                log(str(ex))
                # Crawler.work = False
                # raise ex
        self.save_list(filename + '.queue', self.queue)
        self.threads.remove(self)
        print('▨ stop ' + self.name)

    def request(self):
        snooze = 0
        if self.busy_wait > 0 and len(self.queue) != 0:
            snooze += 0.1 + random() * self.busy_wait/self.threads_number
            self.busy_wait -= snooze
            sleep(snooze)
        if self.busy_wait < 1:
            self.busy_wait = 0
        while 0 == len(self.queue):
            Crawler.wait_count += 1
            snooze += random() * 2
            sleep(snooze)
            if Crawler.threads_number - 3 < Crawler.wait_count < Crawler.threads_number:
                print('# queue almost empty ' + str(Crawler.wait_count))
            if Crawler.threads_number == Crawler.wait_count:
                print('EMPTY QUEUE')
                return Crawler.shutdown()
            Crawler.wait_count -= 1
        self.snooze_summary += snooze
        url = self.queue.pop()

        try:
            r = urlopen(Request(self.root + url, headers={'User-Agent': choice(browsers)}))
        except SocketError as ex:
            self.busy_wait += self.threads_number
            log(str(ex))
            return
        except HTTPError as ex:
            if 503 == ex.code:
                self.busy_wait += self.threads_number
                log(str(ex))
            elif 404 == ex.code:
                if not (url in self.list):
                    self.list.append(url)
            else:
                log(str(ex))
            return

        r = r.read().decode('utf-8')
        anchors = []
        for anchor in anchor_re.findall(r):
            a = anchor.replace(self.root, '')
            if not (a.startswith('http:') or a.startswith('https:')):
                sharp = a.find('#')
                if sharp >= 0:
                    a = a[sharp + 1:]
                if a and a not in anchors:
                    self.schedule(a)
        self.list.append(url)
        count = len(self.list)
        self.file.write(url + '\n')
        if 0 == count % 50:
            now = datetime.now()
            progress = round((now - self.last).seconds/10) * '▯'
            self.last = now
            progress = [self.name, str(count), str(len(self.queue)), progress]
            if self.snooze_summary > 0:
                progress.append(str(round(self.snooze_summary * 10)/10))
                self.snooze_summary = 0
            print('\t'.join(progress))
            self.save()

    @staticmethod
    def schedule(url):
        crc = crc32(url.encode('ascii'))
        crawler = Crawler.threads[crc % len(Crawler.threads)]
        if not (url in crawler.list or url in crawler.queue):
            crawler.queue.appendleft(url)

    def save(self):
        self.save_list(self.queue_filename, self.queue)

    @staticmethod
    def load_list(filename):
        if isfile(filename):
            with open(filename, encoding='utf-8') as f:
                return f.read().split('\n')
        else:
            return []

    @staticmethod
    def save_list(filename, urls):
        with open(filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(urls))

    @staticmethod
    def shutdown():
        Crawler.work = False
        for crawler in Crawler.threads:
            crawler.save()


class SetQueue(Queue):
    def __init__(self, initial):
        super().__init__()
        self.queue = deque(initial)

    def _put(self, item):
        self.queue.appendleft(item)

    def _get(self):
        return self.queue.pop()

_log = open('log', 'w+', encoding='utf-8')


def log(string):
    print('\t' + string)
    _log.write(string + '\n')

anchor_re = regex(r'<a.+href="([^"]+)".*>.+</a>', IGNORECASE)

if not isdir(Crawler.archive):
    makedirs(Crawler.archive)

if '__main__' == __name__:
    def shutdown(sig, frame):
        Crawler.shutdown()
    signal(SIGINT, shutdown)
    Crawler.crawl()
