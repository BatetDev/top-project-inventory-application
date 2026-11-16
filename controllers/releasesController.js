const pool = require("../db/pool");

// GET /releases: show all releases
exports.index = async (req, res) => {
  // 1. Ask the database for all releases (with their genre's name), sorted by title
  const { rows: releases } = await pool.query(`
    SELECT r.*, g.name AS genre_name
    FROM releases r
    JOIN genres g ON g.id = r.genre_id
    ORDER BY r.title
  `);

  // 2. Hand them to views/releases/index.ejs
  res.render("releases/index", { releases });
};

// GET /releases/:id -> one release, with its genre's name
exports.show = async (req, res) => {
  // 1. The id from the URL, e.g. /releases/3 -> "3"
  const { id } = req.params;

  // 2. Find the release, joined with its genre so we can show the name
  const { rows } = await pool.query(
    `
    SELECT r.*, g.name AS genre_name
    FROM releases r
    JOIN genres g ON g.id = r.genre_id
    WHERE r.id = $1
    `,
    [id],
  );
  const release = rows[0]; // undefined if no release has this id

  // 3. No match: respond with 404 and stop
  if (!release) {
    return res.status(404).send("Release not found");
  }

  // 4. Hand it to views/releases/show.ejs
  res.render("releases/show", { release });
};

// GET /releases/new -> show the empty form
exports.newForm = async (req, res) => {
  // 1. The genres fill the <select>, since a release must belong to one
  const { rows: genres } = await pool.query(
    "SELECT * FROM genres ORDER BY name",
  );

  // 2. An empty `release` so the form starts blank
  res.render("releases/new", { release: {}, genres, error: null });
};

// POST /releases -> saves the submitted form
exports.create = async (req, res) => {
  // 1. Clean the input once, then use the clean values everywhere
  const title = (req.body.title ?? "").trim();
  const artist = (req.body.artist ?? "").trim();
  const cover_url = req.body.cover_url?.trim()
    ? req.body.cover_url.trim()
    : null;
  const year = req.body.year === "" ? null : req.body.year;
  const price = req.body.price === "" ? null : req.body.price;
  const genre_id = req.body.genre_id;
  const stock = req.body.stock === "" ? 0 : req.body.stock;

  // Helper: re-show the form with a message and what the user already typed.
  // Async because it re-queries genres for the <select>.
  const showError = async (status, error) => {
    const { rows: genres } = await pool.query(
      "SELECT * FROM genres ORDER BY name",
    );
    res.status(status).render("releases/new", {
      error,
      release: { title, artist, genre_id, year, price, stock, cover_url },
      genres,
    });
  };

  // 2. Validate before touching the database
  if (!title || !artist || !genre_id) {
    return await showError(400, "Title, artist and genre are required.");
  }

  // 3. Save. All seven columns, seven values, same order.
  try {
    await pool.query(
      `INSERT INTO releases (title, artist, genre_id, year, price, stock, cover_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [title, artist, genre_id, year, price, stock, cover_url],
    );
    res.redirect("/releases");
  } catch (err) {
    // 23503 = foreign_key_violation: the chosen genre no longer exists
    if (err.code === "23503") {
      return await showError(409, "That genre no longer exists. Pick another.");
    }
    throw err;
  }
};

// GET /releases/:id/edit -> show the edit form, pre-filled
exports.editForm = async (req, res) => {
  // 1. Clean the input once, then use the clean values everywhere
  const { id } = req.params;

  const {
    rows: [release],
  } = await pool.query("SELECT * FROM releases WHERE id = $1", [id]);

  if (!release) {
    return res.status(404).send("Release not found");
  }

  const { rows: genres } = await pool.query(
    "SELECT * FROM genres ORDER BY name",
  );

  res.render("releases/edit", { release, genres, error: null });
};

// POST /releases/:id/edit -> save the changes
exports.update = async (req, res) => {
  // 1. Clean the input once, then use the clean values everywhere
  const { id } = req.params;
  const title = (req.body.title ?? "").trim();
  const artist = (req.body.artist ?? "").trim();
  const cover_url = req.body.cover_url?.trim()
    ? req.body.cover_url.trim()
    : null;
  const year = req.body.year === "" ? null : req.body.year;
  const price = req.body.price === "" ? null : req.body.price;
  const genre_id = req.body.genre_id;
  const stock = req.body.stock === "" ? 0 : req.body.stock;

  // Helper: re-show the form with a message and what the user already typed.
  // Async because it re-queries genres for the <select>.
  const showError = async (status, error) => {
    const { rows: genres } = await pool.query(
      "SELECT * FROM genres ORDER BY name",
    );
    res.status(status).render("releases/edit", {
      error,
      release: { id, title, artist, genre_id, year, price, stock, cover_url },
      genres,
    });
  };

  // 2. Validate before touching the database
  if (!title || !artist || !genre_id) {
    return await showError(400, "Title, artist and genre are required.");
  }

  // 3. Save. All seven columns, seven values, same order.
  try {
    const result = await pool.query(
      `UPDATE releases SET title = $1, artist = $2, genre_id = $3, year = $4, price = $5, stock = $6, cover_url = $7 WHERE id = $8`,
      [title, artist, genre_id, year, price, stock, cover_url, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Release not found");
    }

    res.redirect(`/releases/${id}`);
  } catch (err) {
    // 23503 = foreign_key_violation: the chosen genre no longer exists
    if (err.code === "23503") {
      return await showError(409, "That genre no longer exists. Pick another.");
    }
    throw err;
  }
};

// POST /releases/:id/delete
exports.remove = async (req, res) => {
  // 1. Read the id from the URL
  const { id } = req.params;
  // 2. Delete the row. rowCount = how many rows were deleted
  const result = await pool.query("DELETE FROM releases WHERE id = $1", [id]);

  // 3. Nothing deleted: no release has this id
  if (result.rowCount === 0) {
    return res.status(404).send("Release not found");
  }
  // 4. Success: the release page no longer exists, so go back to the list
  res.redirect("/releases");
};

/*
// POST /genres/:id/delete -> delete the genre
exports.remove = async (req, res) => {
  // 1. Read the id from the URL
  const { id } = req.params;
  try {
    // 2. Delete the row. rowCount = how many rows were deleted
    const result = await pool.query('DELETE FROM genres WHERE id = $1', [id]);

    // 3. Nothing deleted: no genre has this id
    if (result.rowCount === 0) {
      return res.status(404).send('Genre not found');
    }

    // 4. Success: the genre page no longer exists, so go back to the list
    res.redirect('/genres');
  } catch (err) {
    // 23001 = restrict_violation (ON DELETE RESTRICT)
    if (err.code === '23001') {
      return renderShow(res, id, {
        status: 409,
        error: 'This genre still has releases. Delete or move them first.',
      });
    }
    throw err;
  }
};
*/

/*
title, artist, genre_id, year, price, stock, cover_url
// GET /genres/:id/edit -> show the edit form, pre-filled
exports.editForm = async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query('SELECT * FROM genres WHERE id = $1', [id]);
  const genre = rows[0];

  if (!genre) {
    return res.status(404).send('Genre not found');
  }

  res.render('genres/edit', {
    genre,
    error: null,
    name: genre.name,
    description: genre.description ?? '',
  });
};
*/

/*
const pool = require('../db/pool');

// Loads a genre and its releases, then renders the detail page.
// Used by `show`, and by `remove` when a delete is refused.
async function renderShow(res, id, { status = 200, error = null } = {}) {
  const { rows } = await pool.query('SELECT * FROM genres WHERE id = $1', [id]);
  const genre = rows[0];

  if (!genre) {
    return res.status(404).send('Genre not found');
  }

  const { rows: releases } = await pool.query(
    'SELECT * FROM releases WHERE genre_id = $1 ORDER BY title',
    [id],
  );

  res.status(status).render('genres/show', { genre, releases, error });
}

// GET /genres: show all genres (this is the app's home page)
exports.index = async (req, res) => {
  // 1. Ask the database for all genres, sorted by name
  const { rows: genres } = await pool.query(
    'SELECT * FROM genres ORDER BY name',
  );

  // 2. Hand them to views/genres/index.ejs as a variable called `genres`
  res.render('genres/index', { genres });
};

// GET /genres/:id -> one genre + its releases
exports.show = (req, res) => renderShow(res, req.params.id);

// GET  /genres/new -> show the empty form
exports.newForm = (req, res) => {
  res.render('genres/new', { error: null, name: '', description: '' });
};

// POST /genres -> save the submitted form
exports.create = async (req, res) => {
  // 1. Clean the input once, then use the clean values everywhere
  const name = (req.body.name ?? '').trim();
  const description = (req.body.description ?? '').trim();

  // Helper: re-show the form with a message and what the user already typed
  const showError = (status, error) =>
    res.status(status).render('genres/new', { error, name, description });

  // 2. Validate before touching the database
  if (!name) {
    return showError(400, 'Name is required.');
  }

  // 3. Save. An empty description is stored as NULL instead of ''
  try {
    await pool.query('INSERT INTO genres (name, description) VALUES ($1, $2)', [
      name,
      description || null,
    ]);
    res.redirect('/genres');
  } catch (err) {
    // 23505 = unique_violation: a genre with this name already exists
    if (err.code === '23505') {
      return showError(409, `A genre named "${name}" already exists.`);
    }
    throw err; // anything else is unexpected: let the error handler deal with it
  }
};

// GET /genres/:id/edit -> show the edit form, pre-filled
exports.editForm = async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query('SELECT * FROM genres WHERE id = $1', [id]);
  const genre = rows[0];

  if (!genre) {
    return res.status(404).send('Genre not found');
  }

  res.render('genres/edit', {
    genre,
    error: null,
    name: genre.name,
    description: genre.description ?? '',
  });
};

// POST /genres/:id/edit -> save the changes (mirrors create)
exports.update = async (req, res) => {
  // 1. Read the id from the URL and clean the input once
  const { id } = req.params;
  const name = (req.body.name ?? '').trim();
  const description = (req.body.description ?? '').trim();

  // Helper: re-show the form with a message and what the user already typed.
  // `genre` only carries the id, which the form needs for its action URL.
  const showError = (status, error) =>
    res
      .status(status)
      .render('genres/edit', { genre: { id }, error, name, description });

  // 2. Validate before touching the database
  if (!name) {
    return showError(400, 'Name is required.');
  }

  // 3. Save. An empty description is stored as NULL instead of ''
  try {
    const result = await pool.query(
      'UPDATE genres SET name = $1, description = $2 WHERE id = $3',
      [name, description || null, id],
    );

    // 4. No row matched this id: the genre doesn't exist
    if (result.rowCount === 0) {
      return res.status(404).send('Genre not found');
    }

    res.redirect(`/genres/${id}`);
  } catch (err) {
    // 23505 = unique_violation: another genre already has this name
    if (err.code === '23505') {
      return showError(409, `A genre named "${name}" already exists.`);
    }
    throw err; // anything unexpected: let the error handler deal with it
  }
};

// POST /genres/:id/delete -> delete the genre
exports.remove = async (req, res) => {
  // 1. Read the id from the URL
  const { id } = req.params;
  try {
    // 2. Delete the row. rowCount = how many rows were deleted
    const result = await pool.query('DELETE FROM genres WHERE id = $1', [id]);

    // 3. Nothing deleted: no genre has this id
    if (result.rowCount === 0) {
      return res.status(404).send('Genre not found');
    }

    // 4. Success: the genre page no longer exists, so go back to the list
    res.redirect('/genres');
  } catch (err) {
    // 23001 = restrict_violation (ON DELETE RESTRICT)
    if (err.code === '23001') {
      return renderShow(res, id, {
        status: 409,
        error: 'This genre still has releases. Delete or move them first.',
      });
    }
    throw err;
  }
};
*/
