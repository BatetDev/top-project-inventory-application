const pool = require("../db/pool");

// GET /releases: show all releases
exports.index = async (req, res) => {
  const { rows: releases } = await pool.query(`
    SELECT r.*, g.name AS genre_name
    FROM releases r
    JOIN genres g ON g.id = r.genre_id
    ORDER BY r.title
  `);

  res.render("releases/index", { releases });
};

// GET /releases/:id -> one release, with its genre's name
exports.show = async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(
    `
    SELECT r.*, g.name AS genre_name
    FROM releases r
    JOIN genres g ON g.id = r.genre_id
    WHERE r.id = $1
    `,
    [id],
  );
  const release = rows[0];

  if (!release) {
    return res.status(404).send("Release not found");
  }

  res.render("releases/show", { release });
};

// GET /releases/new -> show the empty form
exports.newForm = async (req, res) => {
  const { rows: genres } = await pool.query(
    "SELECT * FROM genres ORDER BY name",
  );

  res.render("releases/new", { release: {}, genres, error: null });
};

// POST /releases -> saves the submitted form
exports.create = async (req, res) => {
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

  if (!title || !artist || !genre_id) {
    return await showError(400, "Title, artist and genre are required.");
  }

  // Save. All seven columns, seven values, same order.
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

  if (!title || !artist || !genre_id) {
    return await showError(400, "Title, artist and genre are required.");
  }

  // Save. All seven columns, seven values, same order.
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
  const { id } = req.params;
  const result = await pool.query("DELETE FROM releases WHERE id = $1", [id]);

  if (result.rowCount === 0) {
    return res.status(404).send("Release not found");
  }

  res.redirect("/releases");
};
