const { Vonage } = require('@vonage/server-sdk')

// models
const Otps = require('../models/otp.model')

const vonage = new Vonage({
  apiKey: process.env.SMS_API_KEY,
  apiSecret: process.env.SMS_API_SECRET
})

const sendSms = async (req, res, next) => {

    const { userId, phoneNumber } = req.body

    const userPhone = await Otps.findOne({ phoneNumber })
    if (userPhone) {
        return res.status(400).json({ status: false, msg: "This phone number already exists!" })
    }
    
    // create otp 4 digit
    const otp = `${Math.floor(1000 + Math.random() * 9000)}` //0 to 1

    const from = "Vonage APIs"
    const to = phoneNumber
    const text = `${otp}. This OTP code will be expired in 5 minutes!`

    try{
        const result = await vonage.sms.send({to, from, text})
        console.log(result);
        const { messageId } = result.messages[0]
        
        if(!messageId){
            return res.status(500).json({ status: false, otp, msg: "Error in sending the message!" })
        }
        
        req.smsData = {
            userId,
            phoneNumber,
            otp
        }
        next()

    }catch(err){
        next(err)
    }
}

module.exports = {
    sendSms
}