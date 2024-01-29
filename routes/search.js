const express = require('express')
const router = express.Router()
const { isSignedIn, isAdminSignedIn } = require('../controllers/adminpanelsignin')
const { searchUser, search, catesearch, blockSearch, reportSearch, feedbackSearch, faqSearch, roleSearch, generalSearch } = require('../controllers/search')

//* User side
router.get('/user/searchUser', isSignedIn, searchUser )

//* Admin side
router.post("/admin/search", isAdminSignedIn, search);
router.post("/admin/searchCategory", isAdminSignedIn, catesearch);
router.post("/admin/searchBlocklist", isAdminSignedIn, blockSearch);
router.post("/admin/searchReportlist", isAdminSignedIn, reportSearch);
router.post("/admin/searchFeedbacklist", isAdminSignedIn, feedbackSearch);
router.post("/admin/searchFAQlist", isAdminSignedIn, faqSearch);
router.post("/admin/searchRolechangeRequest", isAdminSignedIn, roleSearch)

//* General Search API for Admin side
router.post("/admin/generalsearch", isAdminSignedIn, generalSearch)

module.exports = router