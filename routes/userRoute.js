const router = require('express').Router()

// controllers
const { updatePassword, searchUsers, getByUserId, getAllUsers, updateMe, updateUser, updateUserRole, deleteUserRole } = require('../controllers/userCtrl');
const { accessUserRoute, accessUserRoleRoute } = require('../middlewares/roleAuth');

// middlewares
const { uploadImages } = require('../middlewares/uploadImages');

// routes

router.put('/:id/updateMyPw', updatePassword)
router.put('/:id/updateMe', uploadImages, updateMe)

// ----------------------- can do only Admin -------------------------------
router.get('/', accessUserRoute, getAllUsers)
router.get('/:id', accessUserRoute, getByUserId)
router.get('/search/:key', accessUserRoute, searchUsers)
router.put('/:id', accessUserRoute, uploadImages, updateUser)

// ----------------------- can do only Super Admin -------------------------------
router.put('/role/:id', accessUserRoleRoute, updateUserRole)
router.delete('/role/:id', accessUserRoleRoute, deleteUserRole)

module.exports = router;