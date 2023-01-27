const router = require('express').Router()

// controllers
const { updatePassword, getByUserId, getAllUsers, updateMe, updateUser, grantRole } = require('../controllers/userCtrl');

// middlewares
const { roleAuth } = require('../middlewares/roleAuth');
const { profileUpdateValidator } = require('../Validators/users/profileUpdateValidator');

// routes
router.put('/password', updatePassword)
router.put('/me', profileUpdateValidator, updateMe)

router.get('/', getAllUsers)
router.get('/:id', getByUserId)

// ----------------------- can do only SuperAdmin & Admin -------------------------------

router.put('/:id', roleAuth("Superadmin", "Admin"), profileUpdateValidator, updateUser)

// ----------------------- can do only Super Admin -------------------------------

router.put('/:id/grant', roleAuth("Superadmin"), grantRole)

// test
router.get('/', roleAuth, getAllUsers)

module.exports = router;