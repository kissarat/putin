

#!/usr/bin/env bash

# copy (select path from url_count order by priority desc, len asc, count desc, time desc) to '/tmp/path.csv' delimiter ';' csv;

for i in `cat path.csv`
do
wget -qO- \
--header="User-Agent: Mozilla/5.0 (Windows NT 6.0) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.97 Safari/537.11" \
--header="Referer: http://archive.org/" \
"http://web.archive.org/save/http://forum.ru-board.com/$i"
done
