const express = require("express");
const releasesController = require("../controllers/releasesController");

const router = express.Router();

// CREATE
router.get("/new", releasesController.newForm); // GET /releases/new -> show the empty form
router.post("/", releasesController.create); // POST /releases -> saves the submitted form

// READ
router.get("/", releasesController.index); // GET /releases -> list all releases
router.get("/:id", releasesController.show); // GET /releases/:id -> one release + its details

// UPDATE
router.get("/:id/edit", releasesController.editForm);
router.post("/:id/edit", releasesController.update);

// DELETE
router.post("/:id/delete", releasesController.remove);

module.exports = router;
