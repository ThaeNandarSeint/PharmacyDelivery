const router = require('express').Router()

// controllers
const { updatePassword, getByUserId, getAllUsers, updateMe, grantRole, getMyInfo } = require('../controllers/user.controller');
const { auth } = require('../middlewares/auth');

// middlewares
const { roleAuth } = require('../middlewares/roleAuth');

const profileUpdateValidator = require('../validators/users/profileUpdate.validator');

// routes
router.get('/me', auth, getMyInfo)
router.put('/me/password', auth, updatePassword)
router.put('/me', auth, profileUpdateValidator, updateMe)

router.get('/', auth, getAllUsers)
router.get('/:id', auth, getByUserId)

// ----------------------- can do only SuperAdmin & Admin -------------------------------

// router.put('/:id', roleAuth("Superadmin", "Admin"), profileUpdateValidator, updateUser)

// ----------------------- can do only Super Admin -------------------------------

router.put('/grant/:id', auth, roleAuth("Superadmin"), grantRole)

module.exports = router;