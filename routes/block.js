const router = require("express").Router();
const { isSignedIn } = require("../controllers/adminpanelsignin");
const { block, userUnblock} = require("../controllers/block");

router.post("/block", isSignedIn, block);
router.patch("/unblock", isSignedIn, userUnblock);


module.exports = router;