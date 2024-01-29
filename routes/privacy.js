const express = require("express");
const router = express.Router();
const { isSignedIn, isAdminSignedIn } = require("../controllers/adminpanelsignin");
const { createPrivacy, getPrivacy, updatePrivacy, deletePrivacy, getPrivacyUser} = require("../controllers/privacy")

//* Create new privacy
router.post("/admin/privacy/create", isAdminSignedIn, createPrivacy)

//* Update Privacy
router.patch("/admin/privacy/update/:id", isAdminSignedIn, updatePrivacy)

//* Get Pivacy For Admin and user
router.get("/admin/privacy/get", isAdminSignedIn, getPrivacy)
router.post("/user/privacy/get", isSignedIn, getPrivacyUser)

//* Remove Privacy
router.delete("/admin/privacy/delete/:id", isAdminSignedIn, deletePrivacy)

module.exports = router;