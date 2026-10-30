# giardia.ro

Site-ul oficial al trupei GIARDIA (groove / thrash metal, România), plus jocul
arcade „Giardia — The Game".

**Live:** https://giardia.ro

## Stack

- **Astro 5** — site static, zero JavaScript de framework pe client.
- **Tailwind 4** — tokenii de design (`src/styles/global.css`) sunt extrași din
  coperta albumului *Vol. 1*.
- **Canvas 2D** pentru joc, TypeScript, fără dependențe.
- Fonturi self-hosted (Big Shoulders Display, Space Grotesk, Space Mono).
- nginx pe VPS, certificat Let's Encrypt cu reînnoire automată.

Singura resursă externă e iframe-ul de Spotify. Restul — fonturi, imagini,
iconițe — se servesc de pe domeniu.

## Dezvoltare

```bash
npm install
npm run dev        # http://localhost:4331
npm run build      # -> dist/
```

## Comenzi utile

```bash
node tools/make-logo.mjs   # regenerează craniul: favicon.svg + PNG-uri
node tools/make-og.mjs     # regenerează /public/og.jpg (imaginea de share)
node tools/test-game.mjs   # testează logica jocului, fără browser
```

Logo-ul e pixel-art definit ca grilă în `tools/make-logo.mjs`. Grila e sursa de
adevăr: modifici acolo, rulezi scriptul, se regenerează tot setul de iconițe.

## Acces la server

Conectarea se face **cu cheie SSH**, prin aliasul din `~/.ssh/config`:

```bash
ssh giardia          # root@213.136.71.183 (vmi1781762.contaboserver.net)
```

Cheia folosita e `~/.ssh/id_ed25519` — aceeasi ca pentru GitHub, protejata cu
passphrase si tinuta in keychain-ul macOS, deci se conecteaza fara sa ceara
nimic. Nu exista nicio parola in acest repo.

Daca `ssh giardia` nu merge de pe o masina noua, instaleaza cheia acolo:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@213.136.71.183
```

> **Atentie la ordinea din `~/.ssh/config`:** blocul `Host giardia` trebuie sa
> stea **inaintea** lui `Host *`. In ssh_config castiga prima valoare gasita
> pentru fiecare optiune, deci un bloc pus dupa wildcard si-ar vedea
> `IdentityFile` ignorat in tacere.

## Deploy

```bash
./deploy/deploy.sh                 # build + rsync
./deploy/deploy.sh --nginx         # și reinstalează vhost-ul + anteturile + hook-ul certbot
```

Nu cere nimic: autentificarea e pe cheie (vezi *Acces la server* mai sus).

Configurația nginx trăiește în `deploy/`. Detalii care contează:

- `security-headers.conf` se include în **fiecare** `location` care are propriul
  `add_header` — altfel nginx ar șterge antetele moștenite (inclusiv HSTS).
- Excepția `^~ /.well-known/acme-challenge/` trebuie să rămână; fără ea,
  regula care blochează fișierele ascunse dă 403 și reînnoirea certificatului
  eșuează.
- `deploy/reload-nginx-hook.sh` se instalează în
  `/etc/letsencrypt/renewal-hooks/deploy/` și reîncarcă nginx după fiecare
  reînnoire.

## Conținut de completat

Editează `src/data/site.ts`:

- `shows` — lista de concerte (goală ⇒ se afișează automat starea „fără date")
- `members` — componența trupei
- `merch` — produse + poze
- `site.origin`, adresele de e-mail
- `links.youtube` / `bandcamp` / `facebook`

## Credite

Fotografiile de concert © Raluca Dragomir.
