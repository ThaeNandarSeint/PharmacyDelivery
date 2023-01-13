const router = require('express').Router()

// controllers
const { updatePassword, searchUsers, getByUserId, getAllUsers, updateMe, updateUser } = require('../controllers/userCtrl');
const { isSuperAdmin, isPharmacyTeam } = require('../middlewares/roleAuth');

// middlewares
const { uploadImages } = require('../middlewares/uploadImages');

// routes

router.put('/:id/updateMyPw', updatePassword)
router.put('/:id/updateMe', uploadImages, updateMe)

// ----------------------- can do only Super Admin -------------------------------
router.get('/search/:key', isSuperAdmin, searchUsers)
router.get('/:id', isSuperAdmin, getByUserId)
router.get('/', isSuperAdmin, getAllUsers)
router.put('/:id', isSuperAdmin, uploadImages, updateUser)

module.exports = router;