#!/bin/sh
set -eu
cd "$(dirname "$0")"
if [ ! -f backend/.env ]; then
  printf '%s\n' 'Primeiro copie backend/.env.example para backend/.env e configure o PostgreSQL.'
  exit 1
fi
npm --prefix backend run db:migrate
npm --prefix frontend run build
exec npm --prefix backend start
