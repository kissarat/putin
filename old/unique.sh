#!/usr/bin/env bash

cd archive/$1
files=`seq 0 11`
wc -l ${files} | tail -n 1
for i in ${files}
do
    sed -i 's/^\///g' ${i}
    cat ${i} | sort | uniq > ${i}.unique; mv ${i}.unique ${i};
    sed -i 's/^\///g' ${i}.queue
    cat ${i}.queue | sort | uniq > ${i}.unique; mv ${i}.unique ${i}.queue;
done
wc -l ${files} | tail -n 1
cat ${files} | sort | uniq > list
wc -l list
cd ..
