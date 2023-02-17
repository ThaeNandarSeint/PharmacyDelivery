const router = require('express').Router()

// controllers
const { register, activateEmail, login, forgotPassword, resetPassword, logout, storeOtp, googleLogin, facebookLogin } = require('../controllers/auth.controller');

// middlewares
const { resetAuth } = require('../middlewares/resetAuth')
const { userAuth } = require('../middlewares/userAuth');
const { sendSms } = require('../middlewares/sendSms');
const { checkOtp } = require('../middlewares/checkOtp');

// validation middlewares
const loginValidator = require('../validators/users/login.validator');
const registerValidator = require('../validators/users/register.validator');
const resetPwValidator = require('../validators/users/resetPassword.validator');
const forgetPwValidator = require('../validators/users/forgetPassword.validator');

// routes
router.post('/register', registerValidator, register)
router.post('/activateEmail', activateEmail)

router.post('/login', loginValidator, login, sendSms, storeOtp)

router.post('/forgotPassword', forgetPwValidator, forgotPassword)
router.post('/resetPassword', resetAuth, resetPwValidator, resetPassword)

// 2factor implementation
router.post('/twoFactor', sendSms, storeOtp)
router.post('/checkOtp', checkOtp)

// 
router.post('/google', googleLogin)
router.post('/facebook', facebookLogin)

router.get('/logout', userAuth, logout)

module.exports = router