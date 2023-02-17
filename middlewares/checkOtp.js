const bcrypt = require('bcrypt')

// models
const Otps = require('../models/otp.model')
const Users = require('../models/user.model')

// helpers
const { createAccessToken } = require('../helpers/createTokens')

const checkOtp = async (req, res, next) => {
    try{
        const { userId, otp } = req.body
        if(!userId || !otp){
            const error = new Error("Important information are required!");
                error.status = 400;
                return next(error)
        }

        const otpCode = await Otps.findOne({ userId })
        
        if(!otpCode.otp){
            const error = new Error("OTP is not found!");
                error.status = 400;
                return next(error)
        }
        const { expiresAt } = await Otps.findOne({ userId })
        if(expiresAt < Date.now()){
            await Otps.deleteMany({ expiresAt })
            const error = new Error("Code has expired. Please request again!");
                error.status = 400;
                return next(error)
        }

        const isValid = await bcrypt.compare(otp, otpCode.otp)
        if(!isValid){
            const error = new Error("Wrong code. Please check your message again!");
            error.status = 400;
            return next(error)
        }

        const { isTwoFactor } = await Users.findById(userId) 

        if(!isTwoFactor){
            await Users.findByIdAndUpdate(userId, {
                isTwoFactor: true,
                phoneNumber: otpCode.phoneNumber
            })
            await Otps.deleteMany({ otp: otpCode.otp })

            return res.status(200).json({ statusCode: 200, payload: {  }, message: "Success!" })
        }       

        const accessToken = createAccessToken({ id: userId })

        await Otps.deleteMany({ otp: otpCode.otp })

        return res.status(200).json({ statusCode: 200, payload: { accessToken }, message: "Success!" })

    }catch(err){
        next(err);
    }
}

module.exports = {
    checkOtp
}