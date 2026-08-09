/**
 * Traduceri. O singura sursa pentru ambele limbi — daca o cheie lipseste
 * din `en`, TypeScript se plange la build, deci nu putem livra jumatati.
 */

export const languages = {
  ro: { label: 'Română', short: 'RO', htmlLang: 'ro', ogLocale: 'ro_RO' },
  en: { label: 'English', short: 'EN', htmlLang: 'en', ogLocale: 'en_GB' },
} as const;

export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'ro';

/**
 * Perechile de rute. Cheia e ruta canonica in romana; valoarea e traducerea.
 * Folosite si pentru hreflang, si pentru comutatorul de limba.
 */
export const routes = {
  home: { ro: '/', en: '/en' },
  game: { ro: '/joc', en: '/en/game' },
} as const;

export type RouteKey = keyof typeof routes;

export function pathFor(key: RouteKey, lang: Lang): string {
  return routes[key][lang];
}

/** Ancorele din pagina, prefixate cu ruta de home a limbii. */
export function anchor(hash: string, lang: Lang): string {
  const base = routes.home[lang];
  return `${base === '/' ? '' : base}/#${hash}`.replace('//#', '/#');
}

const ro = {
  meta: {
    description:
      'GIARDIA — trupă de groove metal și thrash din România. Ascultă albumul Vol. 1, vezi datele de concert și joacă Giardia, jocul oficial al trupei.',
    gameTitle: 'Joc',
    gameDescription:
      'Giardia — The Game: joc arcade gratuit în browser. Ești parazitul, intestinul e terenul. Mănâncă tot și ferește-te de metronidazol.',
  },
  nav: {
    music: 'Muzică',
    gallery: 'Galerie',
    shows: 'Concerte',
    merch: 'Merch',
    game: 'Joc',
    contact: 'Contact',
    open: 'Deschide meniul',
    close: 'Închide meniul',
    main: 'Navigare principală',
    home: 'pagina principală',
    skip: 'Sari la conținut',
    langLabel: 'Schimbă limba',
  },
  hero: {
    tagline: 'Groove. Thrash. Parazitar.',
    country: 'România',
    blurb1: 'Riff-uri groase, tempo care te calcă și versuri în română care nu se iau în serios. Album de debut —',
    blurb2: ', 2026 — afară acum.',
    listen: 'Ascultă',
    play: 'Joacă',
    scroll: 'Scroll',
  },
  music: {
    title: 'Muzică',
    releases: (n: number) => `${n} apariții`,
    album: 'Album',
    coverAlt: (t: string) => `Coperta albumului ${t} de GIARDIA`,
    prevSingle: 'Single anterior:',
    openSpotify: 'Deschide pe Spotify',
    embedTitle: 'GIARDIA pe Spotify',
    note: 'Vol. 1 e disponibil pe toate platformele. Dacă vrei să ne ajuți fără să dai un ban: adaugă piesele în playlist-uri și dă mai departe.',
  },
  gallery: {
    title: 'Galerie',
    photoBy: (n: string) => `Foto: ${n}`,
    credit: (n: string) => `Toate fotografiile © ${n}. Reproducere doar cu acord.`,
    alts: {
      vocal: 'Solistul GIARDIA cântând la microfon, cu șapcă, în concert',
      guitar: 'Chitaristul GIARDIA pe scenă, în timpul unui concert',
      drums: 'Bateristul GIARDIA văzut de jos, în plin ritm',
      solo: 'Chitarist GIARDIA în lumini violet, cu expunere lungă',
      bass: 'Basistul GIARDIA aplecat peste instrument, pe scenă',
      portrait: 'Portret alb-negru al unui membru GIARDIA în concert',
    },
  },
  shows: {
    title: 'Concerte',
    count: (n: number) => `${n} date`,
    soon: 'în curând',
    none: 'Nicio dată anunțată',
    noneBody:
      'Momentan nu avem concerte confirmate. Dacă organizezi ceva și vrei o trupă care să dea jos tencuiala, scrie-ne.',
    booking: 'Booking',
    tickets: 'Bilete',
    soldOut: 'Sold out',
    free: 'Intrare liberă',
    locale: 'ro-RO',
  },
  merch: {
    title: 'Merch',
    available: 'disponibil',
    inProduction: 'în producție',
    soon: 'Vine curând',
    soonBody: 'Tricouri și stickere. Pozele urmează. Scrie-ne dacă vrei să prinzi primul lot.',
    notify: 'Anunță-mă',
    priceSoon: 'Preț în curând',
    kinds: { tricou: 'tricou', sticker: 'sticker', altele: 'altele' },
    items: { shirt: 'Tricou GIARDIA — craniu', stickers: 'Set stickere' },
  },
  game: {
    section: 'Jocul',
    note: 'în browser · gratis',
    subtitle: 'The Game',
    blurb:
      'Ești parazitul. Intestinul e terenul. Mănâncă tot ce prinzi, crește, și ferește-te de metronidazol — pastilele nu glumesc.',
    features: ['Tastatură + swipe', 'Fără instalare', 'Scor salvat local'],
    cta: 'Intră în intestin',
    pageBlurb:
      'Ești un trofozoit. Intestinul e al tău până când nu mai e. Mănâncă nutrienții, prinde bila violet pentru bonus și evită pastilele.',
    breadcrumb: 'Firimituri',
    home: 'Acasă',
    controls: 'Controale',
    controlRows: [
      { keys: '↑ ↓ ← →', what: 'Mișcare' },
      { keys: 'W A S D', what: 'Alternativ' },
      { keys: 'Swipe', what: 'Pe telefon' },
      { keys: 'Space', what: 'Pauză' },
    ],
    rulesTitle: 'Reguli',
    rules: [
      'Nutrient verde: +10 puncte, crești cu un segment.',
      'Bilă violet: +50 puncte și încetinește timpul 4 secunde.',
      'Pastilă de metronidazol: te omoară. Dispare singură.',
      'Peretele intestinal și propriul corp sunt fatale.',
    ],
    persist: 'Recordul se salvează în browserul tău. Ștergi datele site-ului, îl pierzi.',
    score: 'Scor',
    record: 'Record',
    soundOn: 'Sunet: on',
    soundOff: 'Sunet: off',
    arenaLabel: 'Arena jocului Giardia',
    // Siruri folosite de motorul jocului
    engine: {
      start: 'Start',
      intro: 'Săgeți / WASD sau swipe. Mănâncă tot, ferește-te de pastile.',
      paused: 'Pauză',
      pausedBody: 'Parazitul așteaptă.',
      resume: 'Continuă',
      dead: 'Ai murit',
      again: 'Încă o dată',
      wall: 'Ai intrat în peretele intestinal.',
      self: 'Te-ai mâncat pe tine. Clasic.',
      pill: 'Metronidazol. Tratamentul a funcționat.',
      scoreIs: (n: number) => `Scor: ${n}.`,
    },
  },
  follow: {
    title: 'Urmărește-ne',
    note: 'zilnic, cam',
    instagram: 'Vezi ce facem pe Instagram',
    instagramBody: 'Poze de la repetiții, bucăți de riff-uri și anunțuri înainte să ajungă oriunde altundeva.',
    youtube: 'Abonează-te pe YouTube',
    youtubeBody: 'Clipuri live, sesiuni și tot ce filmăm pe drum.',
    spotify: 'Ascultă pe Spotify',
    spotifyBody: 'Discografia completă, plus ce mai apare.',
    cta: 'Deschide',
  },
  contact: {
    title: 'Contact',
    note: 'răspundem, promitem',
    bookingLabel: 'Booking & concerte',
    otherLabel: 'Orice altceva',
    elsewhere: 'Unde ne mai găsești',
  },
  footer: {
    rights: 'Toate drepturile rezervate.',
    photos: (n: string) => `Fotografii © ${n}.`,
    email: 'E-mail',
  },
} as const;

/** `satisfies` forteaza aceeasi forma ca `ro` — cheile lipsa pica la build. */
const en = {
  meta: {
    description:
      'GIARDIA — groove metal and thrash band from Romania. Listen to the album Vol. 1, check tour dates and play Giardia, the band’s official game.',
    gameTitle: 'Game',
    gameDescription:
      'Giardia — The Game: free arcade game in your browser. You are the parasite, the gut is the arena. Eat everything and dodge the metronidazole.',
  },
  nav: {
    music: 'Music',
    gallery: 'Gallery',
    shows: 'Shows',
    merch: 'Merch',
    game: 'Game',
    contact: 'Contact',
    open: 'Open menu',
    close: 'Close menu',
    main: 'Main navigation',
    home: 'home page',
    skip: 'Skip to content',
    langLabel: 'Change language',
  },
  hero: {
    tagline: 'Groove. Thrash. Parasitic.',
    country: 'Romania',
    blurb1: 'Thick riffs, tempos that run you over, and Romanian lyrics that refuse to take themselves seriously. Debut album —',
    blurb2: ', 2026 — out now.',
    listen: 'Listen to',
    play: 'Play',
    scroll: 'Scroll',
  },
  music: {
    title: 'Music',
    releases: (n: number) => `${n} releases`,
    album: 'Album',
    coverAlt: (t: string) => `Cover art of the album ${t} by GIARDIA`,
    prevSingle: 'Previous single:',
    openSpotify: 'Open on Spotify',
    embedTitle: 'GIARDIA on Spotify',
    note: 'Vol. 1 is out on every platform. If you want to help without spending a leu: add the tracks to your playlists and pass them on.',
  },
  gallery: {
    title: 'Gallery',
    photoBy: (n: string) => `Photos: ${n}`,
    credit: (n: string) => `All photographs © ${n}. Reuse by permission only.`,
    alts: {
      vocal: 'GIARDIA’s vocalist singing into the mic, wearing a cap, live',
      guitar: 'GIARDIA’s guitarist on stage during a show',
      drums: 'GIARDIA’s drummer shot from below, mid-beat',
      solo: 'GIARDIA guitarist under violet lights, long exposure',
      bass: 'GIARDIA’s bassist hunched over his instrument on stage',
      portrait: 'Black and white portrait of a GIARDIA member playing live',
    },
  },
  shows: {
    title: 'Shows',
    count: (n: number) => `${n} dates`,
    soon: 'coming soon',
    none: 'No dates announced',
    noneBody:
      'No confirmed shows right now. If you’re putting something together and want a band that takes the plaster off the walls, write to us.',
    booking: 'Booking',
    tickets: 'Tickets',
    soldOut: 'Sold out',
    free: 'Free entry',
    locale: 'en-GB',
  },
  merch: {
    title: 'Merch',
    available: 'available',
    inProduction: 'in production',
    soon: 'Coming soon',
    soonBody: 'Shirts and stickers. Photos are on the way. Write to us if you want the first batch.',
    notify: 'Notify me',
    priceSoon: 'Price soon',
    kinds: { tricou: 'shirt', sticker: 'sticker', altele: 'other' },
    items: { shirt: 'GIARDIA shirt — skull', stickers: 'Sticker pack' },
  },
  game: {
    section: 'The game',
    note: 'in browser · free',
    subtitle: 'The Game',
    blurb:
      'You are the parasite. The gut is the arena. Eat everything you can reach, grow, and stay away from metronidazole — those pills do not joke.',
    features: ['Keyboard + swipe', 'No install', 'Score saved locally'],
    cta: 'Enter the gut',
    pageBlurb:
      'You are a trophozoite. The gut is yours until it isn’t. Eat the nutrients, grab the violet bile for a bonus, and dodge the pills.',
    breadcrumb: 'Breadcrumb',
    home: 'Home',
    controls: 'Controls',
    controlRows: [
      { keys: '↑ ↓ ← →', what: 'Move' },
      { keys: 'W A S D', what: 'Alternative' },
      { keys: 'Swipe', what: 'On phone' },
      { keys: 'Space', what: 'Pause' },
    ],
    rulesTitle: 'Rules',
    rules: [
      'Green nutrient: +10 points, you grow one segment.',
      'Violet bile: +50 points and time slows for 4 seconds.',
      'Metronidazole pill: it kills you. It disappears on its own.',
      'The gut wall and your own body are both fatal.',
    ],
    persist: 'Your record is stored in this browser. Clear the site data and it’s gone.',
    score: 'Score',
    record: 'Record',
    soundOn: 'Sound: on',
    soundOff: 'Sound: off',
    arenaLabel: 'Giardia game arena',
    engine: {
      start: 'Start',
      intro: 'Arrows / WASD or swipe. Eat everything, dodge the pills.',
      paused: 'Paused',
      pausedBody: 'The parasite waits.',
      resume: 'Resume',
      dead: 'You died',
      again: 'Once more',
      wall: 'You hit the gut wall.',
      self: 'You ate yourself. Classic.',
      pill: 'Metronidazole. The treatment worked.',
      scoreIs: (n: number) => `Score: ${n}.`,
    },
  },
  follow: {
    title: 'Follow us',
    note: 'daily, roughly',
    instagram: 'See what we’re up to on Instagram',
    instagramBody: 'Rehearsal photos, riff fragments and announcements before they land anywhere else.',
    youtube: 'Subscribe on YouTube',
    youtubeBody: 'Live clips, sessions and everything we film on the road.',
    spotify: 'Listen on Spotify',
    spotifyBody: 'The full discography, plus whatever comes next.',
    cta: 'Open',
  },
  contact: {
    title: 'Contact',
    note: 'we answer, promise',
    bookingLabel: 'Booking & shows',
    otherLabel: 'Anything else',
    elsewhere: 'Where else to find us',
  },
  footer: {
    rights: 'All rights reserved.',
    photos: (n: string) => `Photographs © ${n}.`,
    email: 'E-mail',
  },
} satisfies typeof ro;

export const translations = { ro, en } as const;

export function useTranslations(lang: Lang) {
  return translations[lang];
}
