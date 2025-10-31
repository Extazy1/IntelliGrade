#!/bin/bash

git pull
pnpm build
pm2 list | grep -q "intelligrade-server" && pm2 restart intelligrade-server || pm2 start ecosystem.config.js