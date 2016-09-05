#!/usr/bin/env bash

# copy (select path from url_count order by priority desc, len asc, count desc, time desc) to '/tmp/path.csv' delimiter ';' csv;

for i in `cat path.csv`
do curl -X POST --data "url=http://forum.ru-board.com/$i" http://archive.is/submit/
done
