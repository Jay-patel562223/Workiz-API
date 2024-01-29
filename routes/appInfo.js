const router = require('express').Router()
const { isAdminSignedIn, isSignedIn } = require('../controllers/adminpanelsignin')
const { create, update, get, getForUser, deleteInfo } = require('../controllers/appInfo')

//* Admin Side
router.post("/admin/appInfo/create", isAdminSignedIn, create)
router.patch("/admin/appInfo/update/:id", isAdminSignedIn, update)
router.get("/admin/appInfo/get", isAdminSignedIn, get)
router.delete("/admin/appInfo/delete/:id", isAdminSignedIn, deleteInfo)


//* User Side
router.get("/user/appInfo/get", isSignedIn, getForUser)

module.exports = router