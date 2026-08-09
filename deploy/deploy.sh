#!/usr/bin/env bash
# Deploy giardia.ro pe VPS.
#
#   ./deploy/deploy.sh            build + sincronizare
#   ./deploy/deploy.sh --nginx    si reinstaleaza vhost-ul
#
# Parola SSH se ia din variabila de mediu GIARDIA_SSH_PASS daca exista;
# altfel se foloseste sshpass interactiv sau o cheie SSH deja autorizata.
set -euo pipefail

HOST="${GIARDIA_HOST:-213.136.71.183}"
USER="${GIARDIA_USER:-root}"
ROOT="/var/www/giardia"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Preferam cheia SSH; sshpass doar daca e chiar nevoie.
if [[ -n "${GIARDIA_SSH_PASS:-}" ]] && command -v sshpass >/dev/null; then
  SSH=(sshpass -p "$GIARDIA_SSH_PASS" ssh -o StrictHostKeyChecking=accept-new)
  RSH="sshpass -p $GIARDIA_SSH_PASS ssh -o StrictHostKeyChecking=accept-new"
else
  SSH=(ssh -o StrictHostKeyChecking=accept-new)
  RSH="ssh -o StrictHostKeyChecking=accept-new"
fi

echo "▸ build"
cd "$HERE"
npm run build

echo "▸ pregatesc $ROOT pe $HOST"
"${SSH[@]}" "$USER@$HOST" "mkdir -p $ROOT && chown -R www-data:www-data $ROOT"

echo "▸ sincronizez fisierele"
# --delete: fisierele cu hash vechi dispar, altfel se aduna la infinit.
rsync -az --delete --checksum \
  -e "$RSH" \
  "$HERE/dist/" "$USER@$HOST:$ROOT/"

if [[ "${1:-}" == "--nginx" ]]; then
  echo "▸ instalez antetele de securitate"
  "${SSH[@]}" "$USER@$HOST" "mkdir -p /etc/nginx/snippets"
  rsync -az -e "$RSH" \
    "$HERE/deploy/security-headers.conf" \
    "$USER@$HOST:/etc/nginx/snippets/giardia-headers.conf"

  echo "▸ instalez vhost-ul"
  rsync -az -e "$RSH" \
    "$HERE/deploy/nginx-giardia.conf" \
    "$USER@$HOST:/etc/nginx/sites-available/giardia"
  "${SSH[@]}" "$USER@$HOST" \
    "ln -sfn /etc/nginx/sites-available/giardia /etc/nginx/sites-enabled/giardia && nginx -t && systemctl reload nginx"
fi

"${SSH[@]}" "$USER@$HOST" "chown -R www-data:www-data $ROOT"

echo "▸ verific"
code=$(curl -s -o /dev/null -w '%{http_code}' https://giardia.ro/ || true)
echo "  https://giardia.ro/ -> ${code:-fara raspuns}"
echo "✓ gata"
