// Liste festival de Karine (MyLudo), dans l'ordre de la liste.
const GAMES = [
  ["Schotten Totten", 2016], ["Lucky Numbers", 2020], ["Codex Naturalis", 2020],
  ["Compatibility", 2016], ["Spots ou encore !", 2024], ["Symbiose", 2025],
  ["Love Letter", 2019], ["Courtisans", 2024], ["Star Explorer", 2025],
  ["Star Wars - Bounty Hunters", 2024], ["Koï", 2026],
  ["TTMC - Musique avec les Francofolies", 2024], ["Calico", 2020],
  ["7 Wonders Architects", 2021], ["Cosy Casa", 2023], ["Super Miaou", 2023],
  ["Link City", 2024], ["Mamie Moule Maki", 2023], ["La Planche des Pirates", 2022],
  ["L'Île des Mots Dits", 2025], ["Sanctuary", 2025], ["Lacuna", 2025],
  ["Zenith", 2025], ["Trait Cool", 2026], ["DaDaDa", 2025],
  ["Le Coupable est... Carnivore !", 2026], ["Dice Pool Party", 2026],
  ["Got Five!", 2026], ["Le Chat et la Tour", 2025], ["Panorama", 2026],
  ["Sagrada", 2017], ["Pique Plume", 2015], ["Bomb Busters", 2024],
  ["Odin", 2024], ["The Gang", 2024], ["Viva Catrina", 2025],
  ["Sucré ou Salé ?", 2025], ["Moustache", 2025], ["La Course vers El Dorado", 2023],
  ["Trio", 2023], ["Pina Coladice", 2024], ["Carnuta", 2026], ["Foxy", 2023],
  ["Mozaïk", 2026], ["First Giants", 2026], ["Toy Battle", 2025],
  ["Dragomino", 2020], ["Take Time", 2025], ["Flip 7", 2025],
  ["Akropolis", 2022], ["Captain Flip", 2024], ["Château Combo", 2024],
];

const slug = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const games = GAMES.map(([title, year]) => ({ id: slug(title), title, year }));

module.exports = { games, slug, MAX_PICKS: 30 };
