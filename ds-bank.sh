#!/bin/sh

start_time="$(date -u +%s)"
npm run ds-bank-local
end_time="$(date -u +%s)"

elapsed="$(($end_time-$start_time))"
echo "Total of $elapsed seconds elapsed for ds-bank-local"

start_time="$(date -u +%s)"
npm run ds-bank-test
end_time="$(date -u +%s)"

elapsed="$(($end_time-$start_time))"
echo "Total of $elapsed seconds elapsed for ds-bank-test"