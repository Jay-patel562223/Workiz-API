const express = require("express");
const { testImage, upload } = require("../controllers/test");
const router = express.Router();

const uploadSingleImage = upload.single("image")
router.post('/uploadImage',function (req, res, next) {
    uploadSingleImage(req, res, function (err) {
      if (err) {
        return res.status(400).json({ status: false, error: err.message })
      }
      next()
    })
  },testImage)

module.exports = router