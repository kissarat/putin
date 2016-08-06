from base64 import b64encode
from collections import deque
from datetime import datetime
from os import makedirs
from os.path import isfile, isdir
from queue import Queue
from random import random
from re import compile as regex, IGNORECASE
from signal import signal, SIGINT
from sqlite3 import connect
from sys import argv
from threading import Thread
from time import sleep
from urllib.request import urlopen


class SetQueue(Queue):
    def __init__(self, initial=[]):
        super().__init__()
        self.queue = deque(initial)

    def _put(self, item):
        if item not in self.queue:
            self.queue.appendleft(item)

    def _get(self):
        return self.queue.pop()

work = True
process = SetQueue()
inserts = Queue()
links = SetQueue()
anchor_re = regex(r'<a.+href="([^"]+)".*>.+</a>', IGNORECASE)
host = argv[1]
db = connect(host + '.db')
root = 'http://%s/' % host
c = db.cursor()
c.execute("select type from sqlite_master where name='url'")
rows = c.fetchall()
if 1 != len(rows):
    with open('schema.sql', encoding='utf-8') as schema:
        c = db.cursor()
        c.execute(schema.read())
        db.commit()
archive = 'archive/' + host + '/'
if not isdir(archive):
    makedirs(archive)
_log = open('log', 'w+', encoding='utf-8')


def log(string):
    print('\t' + string)
    _log.write(string + '\n')


def load():
    url = process.get()
    file = archive + b64encode(url.encode('utf-8'), b'+-').decode('utf-8')
    if file == archive:
        file = archive + '_'
    if isfile(file):
        with open(file, encoding='utf-8') as f:
            r = f.read()
    else:
        r = urlopen(root + url)
        if 'text/html' not in r.getheader('Content-Type', ''):
            return
        r = r.read().decode('utf-8')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(r)
    anchors = []

    inserts.put((url, int(datetime.now().timestamp())))
    for anchor in anchor_re.findall(r):
        a = anchor.replace(root, '')
        if not (a.startswith('http:') or a.startswith('https:')):
            sharp = a.find('#')
            if sharp >= 0:
                a = a[sharp + 1:]
            if a and not (a in anchors or a in process.queue):
                links.put(a)


class Job(Thread):
    def run(self):
        print('▨ ▨ start ' + self.getName())
        while work:
            try:
                load()
            except Exception as ex:
                log(str(ex))
        print('▨ stop ' + self.getName())


def shutdown(sig, frame):
    global work
    work = False
    process.task_done()
    inserts.task_done()

process.put('')

signal(SIGINT, shutdown)
for i in range(6):
    if not work:
        break
    job = Job()
    job.start()
    sleep(random())

while work:
    url = None
    try:
        while not links.empty():
            url = links.get_nowait()
            cc = db.cursor()
            cc.execute('select * from url where url.url = ?', (url,))
            rows = cc.fetchall()
            if 0 == len(rows):
                process.put(url)
            db.commit()
        url = inserts.get()
        cc = db.cursor()
        cc.execute('insert into url(url, time) values (?,?)', url)
        db.commit()
        print(url[0])
    except Exception as error:
        if url:
            log(str(error) + '\t' + url if isinstance(url, str) else url[0])
        else:
            log(str(error))
