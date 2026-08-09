/**
 * Sursa unica de adevar pentru continutul site-ului.
 * Tot ce e marcat TODO trebuie completat de trupa — restul e verificat
 * (Spotify, 2026-08-09).
 */

export const site = {
  name: 'GIARDIA',
  domain: 'giardia.ro',
  url: 'https://giardia.ro',
  tagline: 'Groove. Thrash. Parazitar.',
  /** Folosit in <meta description> si in JSON-LD. Max ~155 caractere. */
  description:
    'GIARDIA — trupă de groove metal și thrash din România. Ascultă albumul Vol. 1, vezi datele de concert și joacă Giardia, jocul oficial al trupei.',
  genres: ['Groove Metal', 'Thrash Metal', 'Heavy Metal'],
  // TODO trupa: completati orasul si anul infiintarii.
  origin: { city: 'România', country: 'RO', founded: '' },
  email: 'virgilbaldovin6@gmail.com',
  booking: 'virgilbaldovin6@gmail.com', // aceeasi adresa pana cand trupa are mail pe domeniu
} as const;

export const links = {
  spotify: 'https://open.spotify.com/artist/4GNricNFbsp71cGCIElwkp',
  instagram: 'https://www.instagram.com/giardia.adevarat/',
  youtube: 'https://www.youtube.com/@giardia-r1q',
  // TODO: adaugati daca exista
  bandcamp: '',
  facebook: '',
  appleMusic: '',
} as const;

/** ID-uri Spotify pentru embed-uri. */
export const spotify = {
  artistId: '4GNricNFbsp71cGCIElwkp',
} as const;

/**
 * Muzica din joc. Fisierul trebuie sa fie masterul propriu al trupei, pus in
 * public/audio/ — nu se poate lua din Spotify (fluxul e criptat).
 * Daca fisierul lipseste, jocul detecteaza eroarea si ruleaza in tacere.
 * Pune sirul gol ca sa dezactivezi muzica de tot.
 */
export const gameMusic = {
  src: '/audio/sunt-ca-o-pasare.mp3',
  title: 'Sunt ca o pasăre',
} as const;

export type Release = {
  title: string;
  year: number;
  type: 'album' | 'single' | 'ep';
  tracks: string[];
  cover?: string;
};

export const releases: Release[] = [
  {
    title: 'Vol. 1',
    year: 2026,
    type: 'album',
    tracks: [
      'Vreau să mă las',
      'Să fut',
      'Sunt ca o pasăre',
      'Vecina',
      'Senviș cu ceapă',
    ],
  },
  {
    title: 'Vreau să mă las',
    year: 2025,
    type: 'single',
    tracks: ['Vreau să mă las'],
  },
];

export type Show = {
  date: string; // ISO
  venue: string;
  city: string;
  ticketUrl?: string;
  soldOut?: boolean;
};

/**
 * TODO trupa: adaugati concertele aici. Lista goala afiseaza automat
 * starea "fara date anuntate" + formular de booking.
 */
export const shows: Show[] = [];

export type MerchItem = {
  name: string;
  kind: 'tricou' | 'sticker' | 'altele';
  price?: string;
  image?: string;
  soldOut?: boolean;
};

/** TODO trupa: pozele de merch vin mai tarziu; pana atunci se afiseaza teaser. */
export const merch: MerchItem[] = [
  { name: 'Tricou GIARDIA — craniu', kind: 'tricou' },
  { name: 'Set stickere', kind: 'sticker' },
];

/** Credite foto — obligatoriu, pozele sunt semnate. */
export const photoCredit = 'Raluca Dragomir';

export const members: { name: string; role: string }[] = [
  // TODO trupa: completati. Lasat gol => sectiunea nu se randeaza.
];
