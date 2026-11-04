interface ChampionImage {
  src: string;
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
}

// A bajnoklista azonosítói, nem a Fighter modell azonosítói.
export const CHAMPION_IMAGES: Partial<
  Record<number, ChampionImage>
> = {
  2: {
    src: '/images/champions/petr-yan.jpg',
    author: 'MMAnytt',
    source:
      'https://commons.wikimedia.org/wiki/File:PetrYan.jpg',
    license: 'CC BY 3.0',
    licenseUrl:
      'https://creativecommons.org/licenses/by/3.0/',
  },

  3: {
    src: '/images/champions/alexander-volkanovski.jpg',
    author: 'MMAnytt',
    source:
      'https://commons.wikimedia.org/wiki/File:Alexander_Volkanovski_at_UFC_232.jpg',
    license: 'CC BY 3.0',
    licenseUrl:
      'https://creativecommons.org/licenses/by/3.0/',
  },

  4: {
    src: '/images/champions/justin-gaethje.jpg',
    author: 'Richard Norris',
    source:
      'https://commons.wikimedia.org/wiki/File:Justin_Gaethje.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl:
      'https://creativecommons.org/licenses/by-sa/4.0/',
  },

  5: {
    src: '/images/champions/islam-makhachev.png',
    author: 'Новости ННТ; képmódosítás: Nyuhn',
    source:
      'https://commons.wikimedia.org/wiki/File:Islam_Makhachev_2022_UFC_belt.png',
    license: 'CC BY 3.0',
    licenseUrl:
      'https://creativecommons.org/licenses/by/3.0/',
  },

  8: {
    src: '/images/champions/ciryl-gane.jpg',
    author: 'MHSC TV – Montpellier Hérault Sport Club',
    source:
      "https://commons.wikimedia.org/wiki/File:Ciryl_Gane_en_visite_au_centre_d'entra%C3%AEnement_du_MHSC_(cropped).jpg",
    license: 'CC BY 3.0',
    licenseUrl:
      'https://creativecommons.org/licenses/by/3.0/',
  },
};