const express = require("express");
const router = express.Router();
const { isSignedIn} = require("../controllers/adminpanelsignin");
const { creatReport } = require("../controllers/report");

router.post("/addreport", isSignedIn, creatReport)

module.exports = router;