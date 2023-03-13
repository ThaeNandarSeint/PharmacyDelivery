const router = require('express').Router()

// controllers
const { updatePassword, getByUserId, getAllUsers, updateMe, grantRole, getMyInfo } = require('../controllers/user.controller');
const { auth } = require('../middlewares/auth');

// middlewares
const { roleAuth } = require('../middlewares/roleAuth');
const { userAuth } = require('../middlewares/userAuth');

const profileUpdateValidator = require('../validators/users/profileUpdate.validator');

// routes
router.get('/me/info', auth, getMyInfo)
router.put('/me/password', userAuth, updatePassword)
router.put('/me', userAuth, profileUpdateValidator, updateMe)

router.get('/', userAuth, roleAuth("Superadmin", "Admin"), getAllUsers)
router.get('/:id', userAuth, roleAuth("Superadmin", "Admin"), getByUserId)

// ----------------------- can do only SuperAdmin & Admin -------------------------------

// router.put('/:id', roleAuth("Superadmin", "Admin"), profileUpdateValidator, updateUser)

// ----------------------- can do only Super Admin -------------------------------

router.put('/grant/:id', roleAuth("Superadmin"), grantRole)

module.exports = router;