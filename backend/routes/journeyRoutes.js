const express = require("express");

const {
  searchJourneys,
} = require(
  "../controllers/journeyController"
);

const router = express.Router();

router.get(
  "/search",
  searchJourneys
);

module.exports = router;