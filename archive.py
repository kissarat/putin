#!/usr/bin/env python3

from datetime import datetime
from json import loads
from os.path import isfile, isdir
from random import random
from re import compile as regex, IGNORECASE
from signal import signal, SIGINT
from sys import argv
from threading import Thread
from time import sleep
from urllib.error import HTTPError
from urllib.request import urlopen, Request

headers = {
    'User-Agent': 'Wget/1.16'
}


class Crawler(Thread):
    work = False
    threads = []
    threads_number = 12
    host = argv[1]
    root = 'http://%s/' % host
    archive = 'archive/' + host + '/'

    @staticmethod
    def crawl():
        Crawler.work = True
        for i in range(Crawler.threads_number):
            Crawler.threads.append(Crawler())
        for crawler in Crawler.threads:
            crawler.start()
            sleep(random() * 4)

    def __init__(self, *params):
        super().__init__(*params)
        self.list = []
        self.last = datetime.now()
        self.busy_wait = 0

    def run(self):
        number = self.threads.index(self)
        self.name = 'T' + str(number + 1)
        self.list = self.load_list(self.archive + str(number))
        print('▨ ▨ start ' + self.name)
        while self.work:
            try:
                self.request()
            except IndexError:
                break
            except Exception as ex:
                log(str(ex))
                # Crawler.work = False
                # raise ex
        self.threads.remove(self)
        print('▨ stop ' + self.name)

    def request(self):
        if self.busy_wait > 0:
            snooze = 0.1 + random() * self.busy_wait/self.threads_number
            self.busy_wait -= snooze
            sleep(snooze)
        if self.busy_wait < 1:
            self.busy_wait = 0
        url = self.list.pop()
        try:
            r = urlopen(Request('http://archive.org/wayback/available?url=' + self.root + url, headers=headers))
            data = r.read().decode('utf8')
            r.close()
            data = loads(data)
            if 'closest' not in data['archived_snapshots']:
                r = urlopen(Request('http://web.archive.org/save/' + self.root + url, headers=headers))
                r.read()
        except HTTPError as ex:
            if 502 == ex.code or 503 == ex.code:
                self.busy_wait += self.threads_number * 10
                self.list.append(url)
        # print(url)
        count = len(self.list)
        if 0 == count % 20:
            now = datetime.now()
            progress = round((now - self.last).seconds/5) * '▯'
            self.last = now
            progress = [self.name, str(count), progress]
            print('\t'.join(progress))

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
            crawler.join()
        exit(0)

_log = open('log', 'w+', encoding='utf-8')


def log(string):
    print('\t' + string)
    _log.write(string + '\n')

anchor_re = regex(r'<a.+href="([^"]+)".*>.+</a>', IGNORECASE)

if not isdir(Crawler.archive):
    print()

if '__main__' == __name__:
    def shutdown(sig, frame):
        Crawler.shutdown()
    signal(SIGINT, shutdown)
    Crawler.crawl()
