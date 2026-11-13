// ---------- 1. Setup: environment and imports ----------

const path = require('node:path'); // built-in: builds file paths safely
const express = require('express');

const genresRouter = require('./routes/genresRouter');
// const releasesRouter = require('./routes/releasesRouter');

// ---------- 2. App and config ----------
const app = express(); // create the app object
const PORT = process.env.PORT || 3000; // use the env port if set, else 3000

app.set('views', path.join(__dirname, 'views')); // where the .ejs files live
app.set('view engine', 'ejs'); // so res.render('home') finds views/home.ejs

// ---------- 3. Middleware (runs on every request, in this order) ----------
app.use(express.static(path.join(__dirname, 'public'))); // serve CSS/images from /public
app.use(express.urlencoded({ extended: true })); // parse <form> POST bodies into req.body

// ---------- 4. Routes ----------
app.get('/', (req, res) => res.redirect('/genres'));
app.use('/genres', genresRouter);
// app.use('/releases', releasesRouter);

// ---------- 5. Fallbacks (must come after all routes) ----------
app.use((req, res) => {
  // reached only if nothing above matched
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  // 4 arguments = error handler
  console.error(err);
  res.status(500).send('Something went wrong');
});

// ---------- 6. Start ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
