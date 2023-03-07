const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, "Please enter user id!"],
    },

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
    },

    // role
    roleType: {
        type: String,
        enum: ['Superadmin', 'Admin', 'Supervisor', 'Operator', 'DeliveryPerson', 'Customer'],
    },

    // medicine
    favouriteMedicines: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicines',
            default: ''
        },
    ],

}, {
    timestamps: true
})

module.exports = mongoose.model('Users', userSchema)