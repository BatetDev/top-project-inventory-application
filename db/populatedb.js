#!/usr/bin/env node

// Seed script: drops, recreates and fills the inventory tables.
// Usage: node populatedb.js   (needs DATABASE_URL in your environment / .env)

const { Client } = require('pg');

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
    ('Troubadour Songs',
     'Secular songs of courtly love and chivalry, performed by wandering poet-musicians.'),
    ('Renaissance Polyphony',
     'Interwoven vocal lines in sacred and secular madrigals and motets.');
`;

// Releases are written with the genre *name* (readable) and the genre *id* is
// looked up through the JOIN, so we never hardcode id numbers.
// Note: a typo in a genre name means that row is silently skipped.
const SEED_RELEASES = `
  INSERT INTO releases (title, artist, genre_id, year, price, stock, cover_url)
  SELECT v.title, v.artist, g.id, v.year, v.price, v.stock, v.cover_url
  FROM (VALUES
    -- title,                      artist,                                        genre_name,              year, price, stock, cover_url
    ('Chant',                      'Benedictine Monks of Santo Domingo de Silos', 'Gregorian Chant',       1994, 14.99, 12,    NULL),
    ('Missa Papae Marcelli',       'The Tallis Scholars',                         'Renaissance Polyphony', 1980, 16.50,  8,    NULL),
    ('Songs of the Troubadours',   'Example Ensemble',                            'Troubadour Songs',      2001, 18.00,  5,    NULL)
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
].join('\n');

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
async function main() {
  console.log('seeding...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query(SQL);
    console.log('done');
  } catch (err) {
    console.error('seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
