#!/usr/bin/env node

const { Client } = require('pg');

const SQL = `
DROP TABLE IF EXISTS releases;
DROP TABLE IF EXISTS genres;

CREATE TABLE genres (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE releases (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE RESTRICT,
  year INTEGER,
  price NUMERIC(10,2) CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  cover_url TEXT
);

INSERT INTO genres (name, description)
VALUES
  ('Gregorian Chant', 'Unaccompanied sacred song in Latin, sung in unison by monastic choirs.'),
  ('Troubadour Songs', 'Secular songs of courtly love and chivalry, performed by wandering poet-musicians.'),
  ('Renaissance Polyphony', 'Interwoven vocal lines in sacred and secular madrigals and motets.');
  
INSERT INTO releases (title, artist, genre_id, year, price, stock, cover_url)
SELECT v.title, v.artist, g.id, v.year, v.price, v.stock, v.cover_url
FROM (VALUES
  ('Chant', 'Benedictine Monks of Santo Domingo de Silos', 'Gregorian Chant', 1994, 14.99, 12, NULL),
  ('Missa Papae Marcelli', 'The Tallis Scholars', 'Renaissance Polyphony', 1980, 16.50, 8, NULL),
  ('Songs of the Troubadours', 'Example Ensemble', 'Troubadour Songs', 2001, 18.00, 5, NULL)
) AS v(title, artist, genre_name, year, price, stock, cover_url)
JOIN genres g ON g.name = v.genre_name;
`;

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
