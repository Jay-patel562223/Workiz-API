const router = require("express").Router();

const {
  createRating,
  showAllRating,
  showRating,
} = require("../controllers/rating");
const { isSignedIn } = require("../controllers/adminpanelsignin");

router.post("/rating", isSignedIn, createRating);
router.get("/showallrating", isSignedIn,showAllRating);
router.get("/showrating", isSignedIn,showRating);

module.exports = router;
