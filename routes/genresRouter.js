const express = require("express");
const genresController = require("../controllers/genresController");

const router = express.Router();

// All paths are relative to /genres (mounted in app.js).

// CREATE: fixed paths first, so '/new' isn't read as an :id
router.get("/new", genresController.newForm);
router.post("/", genresController.create);

// READ
router.get("/", genresController.index);
router.get("/:id", genresController.show);

// UPDATE
router.get("/:id/edit", genresController.editForm);
router.post("/:id/edit", genresController.update);

// DELETE
router.post("/:id/delete", genresController.remove);

module.exports = router;
