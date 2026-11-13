const express = require('express');
const genresController = require('../controllers/genresController');

const router = express.Router();

// All paths are relative to /genres (mounted in app.js)

// Create: fixed paths first, so '/new' isn't read as an :id
router.get('/new', genresController.newForm); // GET  /genres/new -> show the empty form
router.post('/', genresController.create); // POST /genres     -> save the submitted form

// Read
router.get('/', genresController.index); // GET  /genres     -> list all genres
router.get('/:id', genresController.show); // GET  /genres/:id -> one genre + its releases

module.exports = router;
