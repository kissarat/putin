from base64 import b64encode
from binascii import crc32
from collections import deque
from datetime import datetime
from os import makedirs
from os.path import isfile, isdir
from queue import Queue
from random import random
from re import compile as regex, IGNORECASE
from signal import signal, SIGINT
from sys import argv
from threading import Thread
from time import sleep
from urllib.request import urlopen


class Crawler(Thread):
    work = False
    threads = []
    host = argv[1]
    root = 'http://%s/' % host
    archive = 'archive/' + host + '/'
    last = datetime.now()
    wait_count = 0

    @staticmethod
    def crawl():
        Crawler.work = True
        for i in range(12):
            Crawler.threads.append(Crawler())
        Crawler.schedule('')
        for crawler in Crawler.threads:
            sleep(random() * 2)
            crawler.start()

    def __init__(self, *params):
        super().__init__(*params)
        self.queue = deque([])
        self.list = []
        self.file = None
        self.queue_filename = None

    def run(self):
        number = self.threads.index(self)
        self.name = 'T' + str(number + 1)
        filename = self.archive + str(number)
        self.queue_filename = filename + '.queue'
        self.list = self.load_list(filename)
        self.queue = deque(self.load_list(filename) + list(self.queue))
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
        while 0 == len(self.queue):
            Crawler.wait_count += 1
            sleep(random() * 2)
            if 9 < Crawler.wait_count < 12:
                print('# queue almost empty ' + str(Crawler.wait_count))
            if 12 == Crawler.wait_count:
                print('EMPTY QUEUE')
                return Crawler.shutdown()
            Crawler.wait_count -= 1
        url = self.queue.pop()
        r = urlopen(self.root + url)
        r = r.read().decode('utf-8', 'ignore')
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
            progress = round((datetime.now() - self.last).seconds/10) * '▯'
            print('\t'.join([self.name, str(count), str(len(self.queue)), progress]))
            self.save()

    @staticmethod
    def schedule(url):
        crc = crc32(url.encode('ascii', 'ignore'))
        crawler = Crawler.threads[crc % len(Crawler.threads)]
        if not (url in crawler.list or url in crawler.queue):
            crawler.queue.appendleft(url)

    def save(self):
        self.save_list(self.queue_filename, self.queue)
        self.last = datetime.now()

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
