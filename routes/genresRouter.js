const express = require('express');
const genresController = require('../controllers/genresController');

const router = express.Router();

router.get('/', genresController.index);
router.get('/:id', genresController.show);

module.exports = router;
