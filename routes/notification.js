const express = require("express");
const router = express.Router();
const { isSignedIn, isAdminSignedIn} = require("../controllers/adminpanelsignin");
const { sendToDevice, sendToAllDevice, updateFcmToken, notification, upload, getNotification, deleteNotification, personalUser, getUserNotification } = require("../controllers/notification");

//* User Side
router.patch("/fcmToken", isSignedIn, updateFcmToken)
router.post("/sendToDevice", isSignedIn, sendToDevice)
router.patch("/on-off", isSignedIn, notification)
router.patch("/personal-user/on-off", isSignedIn, personalUser)
router.get("/getNotification", isSignedIn, getUserNotification)

//* Admin Side
const uploadSingleImage = upload.single("image")
router.post("/sendToAllDevice", isAdminSignedIn,function (req, res, next) {
    uploadSingleImage(req, res, function (err) {
      if (err) {
        return res.status(400).json({ status: false, error: err.message })
      }
      next()
    })
  }, sendToAllDevice)
router.get("/notificationList", isAdminSignedIn, getNotification)
router.delete("/delete/:id", isAdminSignedIn, deleteNotification)

module.exports = router;
