#!/bin/bash

CURRENT=$(cd $(dirname $0);pwd)

cd ${CURRENT}

git checkout .

git pull

yarn install
yarn upgrade
