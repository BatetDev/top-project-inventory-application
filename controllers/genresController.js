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
