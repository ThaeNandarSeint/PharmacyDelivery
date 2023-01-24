const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// models
const Users = require('../models/userModel')
const Otps = require('../models/otpModel')

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
        const txt = "Verify your email address"

        const html = `
        <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
            <h2 style="text-align: center; text-transform: uppercase;color: #009688;">Welcome From Pharmacy Delivery App</h2>
            <p>Congratulations! You're almost set to start using Pharmacy Delivery App.
                Just click the button below to validate your email address. 
                <span style="color: red">This token will be expired in 5 minutes !</span>
            </p>
            
            <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">${txt}</a>
        
            <p>If the button doesn't work for any reason, you can also click on the link below:</p>
        
            <div>${url}</div>
        </div>
        `

        sendMail(email, html)

        return res.status(200).json({ status: 200, msg: "Register Success! Please activate your email to start" })

    } catch (err) {
        next(err);
    }
}

// activate email
const activateEmail = async (req, res, next) => {
    try {
        // check email activation token
        const { activation_token } = req.body

        jwt.verify(activation_token, ACTIVATION_TOKEN_SECRET, async (err, user) => {
            if (err) {
                return res.status(400).json({ status: false, msg: err.message })
            }
            const { name, email, password } = user

            // // unique validation
            const userEmail = await Users.findOne({ email })
            if (userEmail) {
                return res.status(400).json({ status: 400, msg: "This email already exists!" })
            }

            let newUserId;

            const documentCount = await Users.countDocuments()
            newUserId = "U_" + (documentCount + 1)

            const lastUser = await Users.findOne().sort({ createdAt: -1 })

            if (lastUser) {
                const { userId } = lastUser
                const charArray = userId.split("")
                const newCharArray = charArray.filter((char) => char !== 'U' && char !== "_")
                const oldUserId = newCharArray.toString()

                newUserId = "U_" + ((oldUserId * 1) + 1)
            }

            // create user model & save in mongodb
            if (newUserId) {
                const newUser = new Users({
                    userId: newUserId,
                    name,
                    email,
                    password,
                    pictureUrls: ["https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/Users/default-profile-picture_nop9jb.webp"],
                    picPublicIds: 'PharmacyDelivery/Users/default-profile-picture_nop9jb.webp'
                })

                const savedUser = await newUser.save()

                const access_token = createAccessToken({ id: savedUser._id })
                res.cookie('access_token', access_token, cookieOptions)

                return res.status(201).json({ status: 201, user: savedUser, msg: "Account has been created!" })
            }
        })

    } catch (err) {
        next(err);
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

        const txt = "Reset your password"

        const html = `
        <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
            <h2 style="text-align: center; text-transform: uppercase;color: #009688;">Welcome From Pharmacy Delivery App</h2>
            <p>Congratulations! You're almost set to start using Pharmacy Delivery App.
                Just click the button below to validate your email address. 
                <span style="color: red">This token will be expired in 5 minutes !</span>
            </p>
            
            <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">${txt}</a>
        
            <p>If the button doesn't work for any reason, you can also click on the link below:</p>
        
            <div>${url}</div>
        </div>
        `

        sendMail(email, html)

        return res.status(200).json({ status: 200, msg: "Already resend your password, please check your email !" })

    } catch (err) {
        next(err);
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
    }
}

// logout
const logout = async (req, res, next) => {
    try {
        res.clearCookie('access_token', { path: '/api' })
        return res.status(200).json({ status: 200, msg: "Logged out!" })

    } catch (err) {
        next(err);
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

        return res.json({ status: true, otp, msg: "OTP is sent" })

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