const Users = require('../models/userModel')
const Otps = require('../models/otpModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// helpers
const { createActivationToken, createAccessToken } = require('../helpers/createTokens')
const { cookieOptions } = require('../helpers/cookieOptions')

// services
const sendMail = require('../services/sendMail')

// from dot env
const ACTIVATION_TOKEN_SECRET = process.env.ACTIVATION_TOKEN_SECRET
const CLIENT_URL = process.env.CLIENT_URL

// register
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body
        // unique validation
        const userEmail = await Users.findOne({ email })
        if (userEmail) {
            return res.status(400).json({ status: 400, msg: "This email already exists!" })
        }

        // create user model
        const passwordHash = await bcrypt.hash(password, 12)
        const newUser = {
            name,
            email,
            password: passwordHash
        }
        // create email activation token
        const activation_token = createActivationToken(newUser)

        const url = `${CLIENT_URL}/user/activate/${activation_token}`
        sendMail(email, url, "Verify your email address")

        return res.status(200).json({ status: 200, msg: "Register Success! Please activate your email to start" })

    } catch (err) {
        next(err);
        return res.status(500).json({ status: 500, msg: err.message })
    }
}

// activate email
const activateEmail = async (req, res, next) => {
    try {
        // check email activation token
        const { activation_token } = req.body
        const user = jwt.verify(activation_token, ACTIVATION_TOKEN_SECRET)

        const { name, email, password } = user

        // // unique validation
        const userEmail = await Users.findOne({ email })
        if (userEmail) {
            return res.status(400).json({ status: 400, msg: "This email already exists!" })
        }

        // // create user model & save in mongodb
        const newUser = new Users({
            name, 
            email, 
            password,
            pictureUrls: [ "https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/Users/default-profile-picture_nop9jb.webp" ],
            picPublicIds: 'PharmacyDelivery/Users/default-profile-picture_nop9jb.webp'
        })

        const savedUser = await newUser.save()

        const access_token = createAccessToken({ id: savedUser._id })        
        res.cookie('access_token', access_token, cookieOptions)

        return res.status(201).json({ status: 201, user: savedUser, msg: "Account has been created!" })

    } catch (err) {
        
        if (err.name === 'TokenExpiredError') {
            return res.status(406).json({ status: 406, msg: 'JWT Expired!' })

        } else if(err.name === 'SyntaxError'){
            return res.status(406).json({ status: 406, msg: 'Invalid Token!' })
        }
        else {
            next(err);
            return res.status(500).json({ status: 500, msg: err.message })
        }
    }
}

// login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // check email
        const user = await Users.findOne({ email })
        if (!user) {
            return res.status(400).json({ status: 400, msg: "Wrong credentials!" })
        }
        // check password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ status: 400, msg: "Wrong credentials!" })
        }

        const { isTwoFactor, phoneNumber, _id } = user
        if (isTwoFactor) {
            req.body = { ...req.body, isTwoFactor, phoneNumber, userId: _id }
            next();
            return;
        }

        const access_token = createAccessToken({ id: user._id })
        res.cookie('access_token', access_token, cookieOptions)

        return res.status(200).json({ status: 200, user, msg: "Login Success!" })

    } catch (err) {
        next(err);
        return res.status(500).json({ status: 500, msg: err.message })
    }
}

// forgotPassword
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body
        const user = await Users.findOne({ email })
        if (!user) {
            return res.status(400).json({ status: 400, msg: "This email does not exist!" })
        }

        const activation_token = createActivationToken({ id: user._id })
        const url = `${CLIENT_URL}/user/reset/${activation_token}`
        sendMail(email, url, "Reset your password")

        return res.status(200).json({ status: 200, msg: "Already resend your password, please check your email !" })

    } catch (err) {
        next(err);
        return res.status(500).json({ status: 500, msg: err.message })
    }
}

// reset password
const resetPassword = async (req, res, next) => {
    try {
        const { password } = req.body
        const passwordHash = await bcrypt.hash(password, 12)

        const user = await Users.findOneAndUpdate({ _id: req.user.id }, {
            password: passwordHash
        })
        return res.status(200).json({ status: 200, user, msg: "Password is successfully changed!" })

    } catch (err) {
        next(err);
        return res.status(500).json({ status: 500, msg: err.message })
    }
}

// logout
const logout = async (req, res, next) => {
    try {
        res.clearCookie('access_token', { path: '/api' })
        return res.status(200).json({ status: 200, msg: "Logged out!" })

    } catch (err) {
        next(err);
        return res.status(500).json({ status: 500, msg: err.message })
    }
}

// 2 factor authentication
const storeOtp = async (req, res, next) => {
    try {
        const { userId, phoneNumber, otp } = req.smsData

        const otpHash = await bcrypt.hash(otp, 12)

        const newOtp = new Otps({
            userId,
            phoneNumber,
            otp: otpHash,
            createdAt: Date.now(),
            expiresAt: Date.now() + (1000 * 60 * 5)
        })
        await newOtp.save()

        return res.json({ status: true, msg: "OTP is sent" })

    } catch (err) {
        next(err);
        return res.status(500).json({ status: false, msg: err.message })
    }
}

module.exports = {
    register,
    activateEmail,
    login,
    forgotPassword,
    resetPassword,
    logout,
    storeOtp,
}