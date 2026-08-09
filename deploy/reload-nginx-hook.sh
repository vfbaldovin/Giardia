#!/bin/sh
# Hook de deploy pentru certbot.
# Se instaleaza in /etc/letsencrypt/renewal-hooks/deploy/ si ruleaza dupa
# FIECARE reinnoire reusita, pentru orice domeniu de pe server.
#
# Fara el, certbot reinnoieste fisierele dar nginx tine in memorie
# certificatul vechi pana la urmatorul reload — adica pana expira.
set -e

# Reincarca doar daca configuratia e valida; altfel am opri site-ul.
if nginx -t >/dev/null 2>&1; then
    systemctl reload nginx
    echo "certbot deploy-hook: nginx reincarcat pentru ${RENEWED_DOMAINS:-?}"
else
    echo "certbot deploy-hook: nginx -t a esuat, NU am reincarcat" >&2
    exit 1
fi
