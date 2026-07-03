#!/bin/sh
set -e
echo "[medusa] Migrations de base de données..."
npx medusa db:migrate
echo "[medusa] Démarrage du serveur..."
exec npx medusa start
