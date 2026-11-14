const express = require('express');
const genresController = require('../controllers/genresController');

const router = express.Router();

// All paths are relative to /genres (mounted in app.js)

// Create: fixed paths first, so '/new' isn't read as an :id
router.get('/new', genresController.newForm); // GET  /genres/new -> show the empty form
router.post('/', genresController.create); // POST /genres -> save the submitted form

// Read
router.get('/', genresController.index); // GET  /genres -> list all genres
router.get('/:id', genresController.show); // GET  /genres/:id -> one genre + its releases

// Update
router.get('/:id/edit', genresController.editForm); // GET  /genres/:id/edit -> show the edit form

router.post('/:id/edit', genresController.update); // POST /genres/:id/edit -> save the changes

// Delete
router.post('/:id/delete', genresController.remove); // POST /genres/:id/delete -> delete the genre

module.exports = router;
