const router = require('express').Router()

// controllers
const { register, activateEmail, login, forgotPassword, resetPassword, logout, storeOtp } = require('../controllers/authCtrl');

// middlewares
const { resetAuth } = require('../middlewares/resetAuth')
const { userAuth } = require('../middlewares/userAuth');
const { sendSms } = require('../middlewares/sendSms');
const { checkOtp } = require('../middlewares/checkOtp');

// validation middlewares
const loginValidator = require('../validators/users/loginValidator');
const registerValidator = require('../validators/users/registerValidator');
const resetPwValidator = require('../validators/users/resetPwValidator');
const forgetPwValidator = require('../validators/users/forgetPwValidator');

// routes
router.post('/register', registerValidator, register)
router.post('/activation', activateEmail)

router.post('/login', loginValidator, login, sendSms, storeOtp)

router.post('/forgot', forgetPwValidator, forgotPassword)
router.post('/reset', resetAuth, resetPwValidator, resetPassword)

// 2factor implementation
router.post('/twoFactor', sendSms, storeOtp)
router.post('/checkOtp', checkOtp)

router.get('/logout', userAuth, logout)

module.exports = router