const pool = require('../db/pool');

// GET /genres: show all genres (this is the app's home page)
exports.index = async (req, res) => {
  // 1. Ask the database for all genres, sorted by name
  const { rows: genres } = await pool.query(
    'SELECT * FROM genres ORDER BY name',
  );

  // 2. Hand them to views/genres/index.ejs as a variable called `genres`
  res.render('genres/index', { genres });
};

// GET /genres/:id: show one genre and the releases in it
exports.show = async (req, res) => {
  // 1. The id from the URL, e.g. /genres/3 -> "3" (always a string)
  const { id } = req.params;

  // 2. Find the genre
  const { rows: genreRows } = await pool.query(
    'SELECT * FROM genres WHERE id = $1',
    [id],
  );
  const genre = genreRows[0]; // undefined if there is no such genre

  // 3. No match: respond with 404 and stop
  if (!genre) {
    return res.status(404).send('Genre not found');
  }

  // 4. Find the releases that belong to this genre
  const { rows: releases } = await pool.query(
    'SELECT * FROM releases WHERE genre_id = $1 ORDER BY title',
    [id],
  );

  // 5. Hand both to views/genres/show.ejs
  res.render('genres/show', { genre, releases });
};
