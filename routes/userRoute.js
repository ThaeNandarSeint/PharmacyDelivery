const router = require('express').Router()

// controllers
const { updatePassword, searchUsers, getByUserId, getAllUsers, updateMe, updateUser, grantRole } = require('../controllers/userCtrl');

// middlewares
// const { accessUserRoute, accessUserRoleRoute } = require('../middlewares/roleAuth');
const { roleAuth } = require('../middlewares/roleAuth');
const { uploadImages } = require('../middlewares/uploadImages');

// routes
router.put('/:id/updateMyPw', updatePassword)
router.put('/:id/updateMe', uploadImages, updateMe)

// ----------------------- can do only Admin -------------------------------

router.get('/', getAllUsers)
router.get('/:id', getByUserId)
router.get('/search/:key', searchUsers)
router.put('/:id', roleAuth("Superadmin", "Admin"), uploadImages, updateUser)

// // ----------------------- can do only Super Admin -------------------------------
router.put('/:id/grant', roleAuth("Superadmin", "Admin"), grantRole)

// test
router.get('/', roleAuth, getAllUsers)

module.exports = router;