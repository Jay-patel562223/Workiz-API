const router = require('express').Router();

const { isSignedIn, isAdminSignedIn } = require('../controllers/adminpanelsignin');
const {addfeedback, feedbackID, showfeedback, showAllFeedback, getFeedback} = require('../controllers/feedback')

router.param("FeedBackByID", feedbackID)

router.post('/user/addfeedback',isSignedIn,addfeedback)
router.get('/user/showfeedback',isSignedIn,showfeedback)

//* For Admin
router.get('/admin/showfeedback',isAdminSignedIn, showAllFeedback)

//* for one user
router.get('/admin/getfeedback/:id', isAdminSignedIn, getFeedback)

module.exports = router;