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
