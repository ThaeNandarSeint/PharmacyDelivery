const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name!"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Please enter your email!"],
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: [true, "Please enter your password!"]
    },

    pictureUrls: [
        {
            type: String,
            default: 'https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/Users/default-profile-picture_nop9jb.webp'
        }
    ],
    
    picPublicIds: [
        {
            type: String,
            default: 'PharmacyDelivery/Users/default-profile-picture_nop9jb.webp'
        }
    ], 
    
    isTwoFactor: {
        type: Boolean,
        default: false
    },
    phoneNumber: {
        type: String,
        default: ''
    }

}, {
    timestamps: true
})

module.exports = mongoose.model('Users', userSchema)