#!/usr/bin/env node

// Seed script: drops, recreates and fills the inventory tables.
// Usage: node populatedb.js   (needs DATABASE_URL in your environment / .env)

const { Client } = require("pg");

// ---------------------------------------------------------------------------
// 1. Clean slate
// Order matters: `releases` points to `genres`, so it must be dropped first.
// ---------------------------------------------------------------------------
const DROP_TABLES = `
  DROP TABLE IF EXISTS releases;
  DROP TABLE IF EXISTS genres;
`;

// ---------------------------------------------------------------------------
// 2. Schema
// Order matters again: `genres` must exist before `releases` can reference it.
// ---------------------------------------------------------------------------
const CREATE_GENRES = `
  CREATE TABLE genres (
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT
  );
`;

const CREATE_RELEASES = `
  CREATE TABLE releases (
    id        INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title     TEXT NOT NULL,
    artist    TEXT NOT NULL,

    -- A genre can't be deleted while releases still use it (RESTRICT).
    genre_id  INTEGER NOT NULL REFERENCES genres(id) ON DELETE RESTRICT,

    year      INTEGER,
    price     NUMERIC(10, 2) CHECK (price >= 0),
    stock     INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    cover_url TEXT
  );
`;

// ---------------------------------------------------------------------------
// 3. Seed data
// ---------------------------------------------------------------------------
const SEED_GENRES = `
  INSERT INTO genres (name, description)
  VALUES
    ('Gregorian Chant',
     'Unaccompanied sacred song in Latin, sung in unison by monastic choirs.'),
    ('Organum & Ars Antiqua',
     'Early polyphony of the 12th and 13th centuries, from Notre-Dame organum to the motet.'),
    ('Ars Nova',
     'Fourteenth-century polyphony, with measured rhythm and intricate notation.'),
    ('Troubadour & Secular Song',
     'Vernacular songs of courtly love, crusade and satire, by troubadours and trouveres.'),
    ('Instrumental & Dance',
     'Surviving instrumental repertoire: estampies, dances and courtly entertainment music.');
`;

// Releases are written with the genre *name* (readable) and the genre *id* is
// looked up through the JOIN, so we never hardcode id numbers.
// Note: a typo in a genre name means that row is silently skipped.
const SEED_RELEASES = `
  INSERT INTO releases (title, artist, genre_id, year, price, stock, cover_url)
  SELECT v.title, v.artist, g.id, v.year, v.price, v.stock, v.cover_url
  FROM (VALUES
    -- title,                      artist,                             genre_name,                  year, price, stock, cover_url
    -- GREGORIAN CHANT (10)
    ('Chant',                     'Schola of Saint Aldric',           'Gregorian Chant',           1994, 14.99, 12, '/images/covers/schola-of-saint-aldric-chant.webp'),
    ('Missa Papae Marcelli',      'The Tallis Scholars',              'Gregorian Chant',           1980, 16.50,  8, NULL),
    ('The Turning Wheel',         'Collegium Vagorum',                'Gregorian Chant',           2007, 13.99,  9, '/images/covers/collegium-vagorum-the-turning-wheel.webp'),
    ('Requiem Monasticum',        'Monks of the Grey Abbey',          'Gregorian Chant',           1966, 12.99,  4, '/images/covers/monks-of-the-grey-abbey-requiem-monasticum.webp'),
    ('Neumae',                    'Schola Cantorum Sancti Galli',     'Gregorian Chant',           1974, 15.99,  6, '/images/covers/schola-cantorum-sancti-galli-neumae.webp'),
    ('Antiphonale',               'Ensemble Cantus Planus',           'Gregorian Chant',           1983, 14.50,  7, '/images/covers/ensemble-cantus-planus-antiphonale.webp'),
    ('Hymns for the Hours',       'The Tallis Scholars',              'Gregorian Chant',           1991, 16.99,  0, '/images/covers/the-tallis-scholars-hymns-for-the-hours.webp'),
    ('Vigilia Paschalis',         'The Tallis Scholars',              'Gregorian Chant',           2004, 17.50, 11, '/images/covers/the-tallis-scholars-vigilia-paschalis.webp'),
    ('The Cloister Office',       'The Community of Saint Radegund',  'Gregorian Chant',           2012, 15.50,  5, NULL),
    ('Nocturnale',                'Schola Gregoriana Aurelianensis',  'Gregorian Chant',           2021, 18.99, 14, '/images/covers/schola-gregoriana-aurelianensis-nocturnale.webp'),

    -- TROUBADOUR & SECULAR SONG (8)
    ('Songs of the Troubadours',  'Ensemble Beaumont',                'Troubadour & Secular Song', 2001, 18.00,  5, '/images/covers/ensemble-beaumont-songs-of-the-troubadours.webp'),
    ('Rossinhol',                 'Ensemble Fin''Amor',               'Troubadour & Secular Song', 1998, 16.99,  8, '/images/covers/ensemble-fin-amor-rossinhol.webp'),
    ('No Fixed Abode',            'Ensemble Alborada',                'Troubadour & Secular Song', 2008, 15.99,  3, '/images/covers/ensemble-alborada-no-fixed-abode.webp'),
    ('The Snail and the Sword',   'Ensemble Outremer',                'Troubadour & Secular Song', 2014, 17.99,  6, '/images/covers/ensemble-outremer-the-snail-and-the-sword.webp'),
    ('The Dice and the Rose',     'The Wandering Scholars',           'Troubadour & Secular Song', 1997, 14.99, 10, '/images/covers/the-wandering-scholars-the-dice-and-the-rose.webp'),
    ('The Feast of Fools',        'Schola Goliardica',                'Troubadour & Secular Song', 2011, 16.50, 12, '/images/covers/schola-goliardica-the-feast-of-fools.webp'),
    ('Lo Gai Saber',              'Ensemble Fin''Amor',               'Troubadour & Secular Song', 1986, 13.50,  2, '/images/covers/ensemble-fin-amor-lo-gai-saber.webp'),
    ('Canso de la Comtessa',      'Compagnie des Troubadours',        'Troubadour & Secular Song', 1965, 19.99,  4, '/images/covers/compagnie-des-troubadours-canso-de-la-comtessa.webp'),

    -- ORGANUM & ARS ANTIQUA (7)
    ('The Borrowed Face',         'Camerata Compostelana',            'Organum & Ars Antiqua',     1988, 15.00,  7, '/images/covers/camerata-compostelana-the-borrowed-face.webp'),
    ('Fortune''s Wheel',          'Ensemble Rondeau',                 'Organum & Ars Antiqua',     1996, 16.99,  5, '/images/covers/ensemble-rondeau-fortunes-wheel.webp'),
    ('Magnus Liber',              'Schola Parisiensis',               'Organum & Ars Antiqua',     1972, 13.99,  3, '/images/covers/schola-parisiensis-magnus-liber.webp'),
    ('Viderunt Omnes',            'Cappella Sanctae Crucis',          'Organum & Ars Antiqua',     1987, 14.99,  6, '/images/covers/cappella-sanctae-crucis-viderunt-omnes.webp'),
    ('Ad Limina',                 'Camerata Compostelana',            'Organum & Ars Antiqua',     1995, 17.50,  9, '/images/covers/camerata-compostelana-ad-limina.webp'),
    ('Motets of Montpellier',     'Camerata Moteti',                  'Organum & Ars Antiqua',     2005, 18.50,  4, NULL),
    ('Conductus',                 'Ensemble Vox Antiqua',             'Organum & Ars Antiqua',     2022, 19.99,  8, '/images/covers/ensemble-vox-antiqua-conductus.webp'),

    -- ARS NOVA (6)
    ('Bas et Haut',               'Camerata Regia',                   'Ars Nova',                  1979, 13.50,  4, '/images/covers/camerata-regia-bas-et-haut.webp'),
    ('Love in Disguise',          'Camerata degli Alberti',           'Ars Nova',                  2002, 16.99,  7, '/images/covers/camerata-degli-alberti-love-in-disguise.webp'),
    ('The Blind King',            'Ars Combinatoria',                 'Ars Nova',                  2018, 18.99,  5, '/images/covers/ars-combinatoria-the-blind-king.webp'),
    ('The Painted Heart',         'Ensemble Cordier',                 'Ars Nova',                  2009, 17.50,  6, '/images/covers/ensemble-cordier-the-painted-heart.webp'),
    ('Douce Dame',                'Cappella Remensis',                'Ars Nova',                  1993, 15.99,  8, '/images/covers/cappella-remensis-douce-dame.webp'),
    ('De Proportionibus',         'Ensemble Quadrivium',              'Ars Nova',                  2016, 19.50, 10, '/images/covers/ensemble-quadrivium-de-proportionibus.webp'),

    -- INSTRUMENTAL & DANCE (4)
    ('Saltarello Rosso',          'La Piva Dorata',                   'Instrumental & Dance',      2006, 15.99,  9, '/images/covers/la-piva-dorata-saltarello-rosso.webp'),
    ('The Saltarello Garland',    'The Rosewood Waits',               'Instrumental & Dance',      1984, 13.99,  3, '/images/covers/the-rosewood-waits-the-saltarello-garland.webp'),
    ('Measured Steps',            'Ensemble Terpsichore',             'Instrumental & Dance',      2023, 18.50,  6, '/images/covers/ensemble-terpsichore-measured-steps.webp'),
    ('Estampie di Maggio',        'La Piva Dorata',                   'Instrumental & Dance',      2003, 16.50, 11, '/images/covers/la-piva-dorata-estampie-di-maggio.webp')
  ) AS v(title, artist, genre_name, year, price, stock, cover_url)
  JOIN genres g ON g.name = v.genre_name;
`;

// Everything in one string, in execution order. Sent as a single query so
// Postgres runs it as one unit: if any statement fails, nothing is applied.
const SQL = [
  DROP_TABLES,
  CREATE_GENRES,
  CREATE_RELEASES,
  SEED_GENRES,
  SEED_RELEASES,
].join("\n");

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
async function main() {
  console.log("seeding...");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query(SQL);
    console.log("done");
  } catch (err) {
    console.error("seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
