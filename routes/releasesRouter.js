const express = require("express");
const releasesController = require("../controllers/releasesController");

const router = express.Router();

// All paths are relative to /releases (mounted in app.js).

// CREATE: fixed paths first, so '/new' isn't read as an :id
router.get("/new", releasesController.newForm);
router.post("/", releasesController.create);

// READ
router.get("/", releasesController.index);
router.get("/:id", releasesController.show);

// UPDATE
router.get("/:id/edit", releasesController.editForm);
router.post("/:id/edit", releasesController.update);

// DELETE
router.post("/:id/delete", releasesController.remove);

module.exports = router;
