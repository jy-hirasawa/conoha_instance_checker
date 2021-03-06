#!/bin/bash

CURRENT=$(cd $(dirname $0);pwd)
DIR_NAME=`echo "$CURRENT" | sed -e 's/.*\/\([^\/]*\)$/\1/'`

cd /var/www/${DIR_NAME}
git checkout .

git pull
yarn install
yarn upgrade
