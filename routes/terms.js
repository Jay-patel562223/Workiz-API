const express = require('express')
const { isSignedIn, isAdminSignedIn } = require('../controllers/adminpanelsignin')
const router = express.Router()

//terms controllers
const {updateTC, getTC,addTC, removeTC, getTCUser} = require('../controllers/terms')

//Add TC
router.post('/admin/addterms',isAdminSignedIn,addTC)

//Update Terms and Conditions
router.patch('/admin/updateterms/:id', isAdminSignedIn,updateTC)

//get terms and condition
router.post('/user/getterms', isSignedIn,getTCUser)
router.get('/admin/getterms', isAdminSignedIn,getTC)

//* remove T&C
router.delete('/admin/removeterms/:id', isAdminSignedIn, removeTC)

module.exports = router