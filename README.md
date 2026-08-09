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

## Deploy

```bash
export GIARDIA_SSH_PASS='...'      # sau folosește o cheie SSH autorizată
./deploy/deploy.sh                 # build + rsync
./deploy/deploy.sh --nginx         # și reinstalează vhost-ul
```

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
