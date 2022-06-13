#!/bin/sh

start_time="$(date -u +%s)"
npm run ds-staking-local
end_time="$(date -u +%s)"

elapsed="$(($end_time-$start_time))"
echo "Total of $elapsed seconds elapsed for ds-staking-local"

start_time="$(date -u +%s)"
npm run ds-staking-test
end_time="$(date -u +%s)"

elapsed="$(($end_time-$start_time))"
echo "Total of $elapsed seconds elapsed for ds-staking-test"