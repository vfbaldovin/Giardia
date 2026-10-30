#!/usr/bin/env bash
# Deploy giardia.ro pe VPS.
#
#   ./deploy/deploy.sh            build + sincronizare
#   ./deploy/deploy.sh --nginx    si reinstaleaza vhost-ul + antetele
#
# Autentificarea se face cu cheie SSH, prin aliasul `giardia` din
# ~/.ssh/config. Nu mai exista parola nicaieri in acest repo.
set -euo pipefail

# Pe acest Mac exista doua Homebrew-uri: /usr/local (x86) si /opt/homebrew
# (arm64), iar /usr/local vine primul in PATH. Rosetta nu e instalata, deci
# binarele x86 nu pornesc deloc ("Bad CPU type in executable") — inclusiv
# node, de care atarna npm prin shebang. Punem arm64 inainte cand e cazul.
if ! node --version >/dev/null 2>&1 && [ -x /opt/homebrew/bin/node ]; then
  PATH="/opt/homebrew/bin:$PATH"
  export PATH
fi

HOST="${GIARDIA_HOST:-giardia}"   # aliasul din ~/.ssh/config
ROOT="/var/www/giardia"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Esuam devreme si cu un mesaj clar, nu cu un prompt de parola care ar
# bloca scriptul la nesfarsit intr-un context neinteractiv.
if ! ssh -o BatchMode=yes -o ConnectTimeout=8 "$HOST" true 2>/dev/null; then
  echo "✗ Nu pot ajunge la '$HOST' cu cheie SSH." >&2
  echo "  Verifica aliasul din ~/.ssh/config si ca cheia e in agent:" >&2
  echo "    ssh-add -l" >&2
  echo "    ssh-copy-id -i ~/.ssh/id_ed25519.pub root@213.136.71.183" >&2
  exit 1
fi

echo "▸ build"
cd "$HERE"
npm run build

echo "▸ pregatesc $ROOT"
ssh "$HOST" "mkdir -p $ROOT"

echo "▸ sincronizez fisierele"
# --delete: fisierele cu hash vechi dispar, altfel se aduna la infinit.
# Excludem audio/: fisierele de muzica se urca separat, nu sunt in git.
rsync -az --delete --checksum --exclude 'audio/' "$HERE/dist/" "$HOST:$ROOT/"

if [[ "${1:-}" == "--nginx" ]]; then
  echo "▸ instalez antetele de securitate"
  ssh "$HOST" "mkdir -p /etc/nginx/snippets"
  rsync -az "$HERE/deploy/security-headers.conf" \
    "$HOST:/etc/nginx/snippets/giardia-headers.conf"

  echo "▸ instalez vhost-ul"
  rsync -az "$HERE/deploy/nginx-giardia.conf" \
    "$HOST:/etc/nginx/sites-available/giardia"
  ssh "$HOST" \
    "ln -sfn /etc/nginx/sites-available/giardia /etc/nginx/sites-enabled/giardia && nginx -t && systemctl reload nginx"

  echo "▸ instalez hook-ul de reload pentru certbot"
  rsync -az "$HERE/deploy/reload-nginx-hook.sh" \
    "$HOST:/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh"
  ssh "$HOST" "chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh && chown root:root /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh"
fi

ssh "$HOST" "chown -R www-data:www-data $ROOT"

echo "▸ verific"
code=$(curl -s -o /dev/null -w '%{http_code}' https://giardia.ro/ || true)
echo "  https://giardia.ro/ -> ${code:-fara raspuns}"
[[ "$code" == "200" ]] || { echo "  ✗ asteptam 200" >&2; exit 1; }
echo "✓ gata"
