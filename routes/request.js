const express = require("express");
const router = express.Router();
const { isSignedIn } = require("../controllers/adminpanelsignin");
const { sendRequest, updateFlag, checkStatus } = require("../controllers/request");
const { upload } = require("../controllers/message");

const uploadSingleImage = upload.single("file")
router.post("/sendRequest", isSignedIn,function (req, res, next) {
    uploadSingleImage(req, res, function (err) {
      if (err) {
        return res.status(400).json({ status: false, error: err.message })
      }
      next()
    })
  }, sendRequest)
router.patch("/updateFlag", isSignedIn, updateFlag)
router.post("/getRequestStatus", isSignedIn, checkStatus)

module.exports = router;