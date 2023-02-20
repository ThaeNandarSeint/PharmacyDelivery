const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { google } = require('googleapis')
const { OAuth2 } = google.auth

// 
const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID)
const fetch = require('node-fetch')

// models
const Users = require('../models/user.model')
const Otps = require('../models/otp.model')

// helpers
const { createActivationToken, createAccessToken } = require('../helpers/createTokens')
const { activateEmailHtml } = require('../helpers/activateEmailHtml')

// services
const sendMail = require('../services/sendMail')
const { createCustomId } = require('../services/createCustomId')

// 
const ACTIVATION_TOKEN_SECRET = process.env.ACTIVATION_TOKEN_SECRET
const CLIENT_URL = process.env.CLIENT_URL

// 
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body
        // unique validation
        const userEmail = await Users.findOne({ email })
        if (userEmail) {
            const error = new Error("This email already exists!");
            error.status = 400;
            return next(error)
        }

        // create user model
        const passwordHash = await bcrypt.hash(password, 12)

        const isTesting = email.includes("test")

        if (!isTesting) {
            // create email activation token & send email
            const activation_token = createActivationToken({
                name,
                email,
                password: passwordHash
            })

            const url = `${CLIENT_URL}/user/activate/${activation_token}`
            const text = "Verify your email address"

            const html = activateEmailHtml(url, text)

            sendMail(email, html)

            return res.status(200).json({ statusCode: 200, payload: {}, message: "Register Success! Please activate your email to start!" })
        }
        // create custom id
        const id = await createCustomId(Users, "U")

        // create user model & save in mongodb
        if (id) {
            const newUser = new Users({
                id,
                name,
                email,
                password,
                pictureUrls: ["https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/Users/default-profile-picture_nop9jb.webp"],
                picPublicIds: ["PharmacyDelivery/Users/default-profile-picture_nop9jb.webp"]
            })

            const savedUser = await newUser.save()

            // create token
            const accessToken = createAccessToken({ id: savedUser._id })

            return res.status(201).json({ statusCode: 201, payload: { user: savedUser, accessToken }, message: "Account has been created!" })
        }

    } catch (err) {
        next(err);
    }
}

// 
const activateEmail = async (req, res, next) => {
    try {
        // check email activation token
        const { activation_token } = req.body

        // verify token
        jwt.verify(activation_token, ACTIVATION_TOKEN_SECRET, async (err, user) => {
            if (err) {
                const error = new Error(err.message);
                error.status = 400;
                return next(error)
            }
            const { name, email, password } = user

            // unique validation
            const userEmail = await Users.findOne({ email })
            if (userEmail) {
                const error = new Error("This email already exists!");
                error.status = 400;
                return next(error)
            }

            // create custom id
            const id = await createCustomId(Users, "U")

            // create user model & save in mongodb
            if (id) {
                const newUser = new Users({
                    id,
                    name,
                    email,
                    password,
                    pictureUrls: ["https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/Users/default-profile-picture_nop9jb.webp"],
                    picPublicIds: ["PharmacyDelivery/Users/default-profile-picture_nop9jb.webp"]
                })

                const savedUser = await newUser.save()

                // create token
                const accessToken = createAccessToken({ id: savedUser._id })

                return res.status(201).json({ statusCode: 201, payload: { user: savedUser, accessToken }, message: "Account has been created!" })
            }
        })

    } catch (err) {
        next(err);
    }
}

// 
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // check email
        const user = await Users.findOne({ email })
        if (!user) {
            const error = new Error("Wrong credentials!");
            error.status = 400;
            return next(error)
        }
        // check password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            const error = new Error("Wrong credentials!");
            error.status = 400;
            return next(error)
        }

        // check if two factor or not
        const { isTwoFactor, phoneNumber, _id } = user
        if (isTwoFactor) {
            req.body = { ...req.body, isTwoFactor, phoneNumber, userId: _id }
            return next();
        }

        // create token
        const accessToken = createAccessToken({ id: user._id })

        return res.status(200).json({ statusCode: 200, payload: { user, accessToken }, message: "Login Success!" })

    } catch (err) {
        next(err);
    }
}

// 
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body
        const user = await Users.findOne({ email })
        if (!user) {
            const error = new Error("This email does not exist!");
            error.status = 400;
            return next(error)
        }

        // create token & send email
        const activation_token = createActivationToken({ id: user._id })
        const url = `${CLIENT_URL}/user/reset/${activation_token}`

        const text = "Reset your password"
        const html = activateEmailHtml(url, text)

        sendMail(email, html)

        return res.status(200).json({ statusCode: 200, payload: {}, message: "Already resend your password, please check your email!" })

    } catch (err) {
        next(err);
    }
}

// 
const resetPassword = async (req, res, next) => {
    try {
        const { password } = req.body
        const passwordHash = await bcrypt.hash(password, 12)

        const user = await Users.findOneAndUpdate({ _id: req.user.id }, {
            password: passwordHash
        })
        return res.status(200).json({ statusCode: 200, payload: { user }, message: "Password is successfully changed!" })

    } catch (err) {
        next(err);
    }
}

// 
const logout = async (req, res, next) => {
    try {
        // res.clearCookie('access_token', { path: '/api' })
        return res.status(200).json({ statusCode: 200, payload: {}, message: "Logged out!" })

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

        return res.status(200).json({ statusCode: 200, payload: {}, message: "OTP is sent!" })

    } catch (err) {
        next(err)
    }
}

// 
const googleLogin = async (req, res, next) => {
    try {

        const { credential } = req.body
        const verify = await client.verifyIdToken({ idToken: credential, audience: process.env.MAILING_SERVICE_CLIENT_ID })

        const { email, email_verified, name, picture } = verify.payload

        const password = email + process.env.GOOGLE_SECRET

        const passwordHash = await bcrypt.hash(password, 12)

        if (!email_verified) {
            const error = new Error("Wrong credentials!");
            error.status = 400;
            return next(error)
        }

        // 
        const user = await Users.findOne({ email })

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                const error = new Error("Wrong credentials!");
                error.status = 400;
                return next(error)
            }

            // create token
            const accessToken = createAccessToken({ id: user._id })

            return res.status(200).json({ statusCode: 200, payload: { user, accessToken }, message: "Login Success!" })
        }
        // create custom id
        const id = await createCustomId(Users, "U")

        if (id) {
            const newUser = new Users({
                id, name, email, password: passwordHash, pictureUrls: [picture]
            })
            const savedUser = await newUser.save()

            // create token
            const accessToken = createAccessToken({ id: savedUser._id })

            return res.status(201).json({ statusCode: 201, payload: { user: savedUser, accessToken }, message: "Account has been created!" })
        }

    } catch (err) {
        next(err)
    }
}

const facebookLogin = async (req, res, next) => {
    try {

        const { accessToken, userID } = req.body

        const URL = `https://graph.facebook.com/${userID}?fields=id,name,email,picture&access_token=${accessToken}`

        const data = await fetch(URL).then((res) => res.json()).then(res => { return res })

        const { name, email, picture } = data

        const password = email + process.env.FACEBOOK_SECRET

        const passwordHash = await bcrypt.hash(password, 12)

        // 
        const user = await Users.findOne({ email })

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                const error = new Error("Wrong credentials!");
                error.status = 400;
                return next(error)
            }

            // create token
            const accessToken = createAccessToken({ id: user._id })

            return res.status(200).json({ statusCode: 200, payload: { user, accessToken }, message: "Login Success!" })
        }
        // create custom id
        const id = await createCustomId(Users, "U")

        if (id) {
            const newUser = new Users({
                id, name, email, password: passwordHash, pictureUrls: picture.data.url
            })
            const savedUser = await newUser.save()

            // create token
            const accessToken = createAccessToken({ id: savedUser._id })

            return res.status(201).json({ statusCode: 201, payload: { user, accessToken }, message: "Account has been created!" })
        }

    } catch (err) {
        next(err)
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

    googleLogin,
    facebookLogin
}