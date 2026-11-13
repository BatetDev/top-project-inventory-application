const express = require('express');
const genresController = require('../controllers/genresController');

const router = express.Router();

router.get('/', genresController.index);

module.exports = router;
