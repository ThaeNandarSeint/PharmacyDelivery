const mongoose = require('mongoose')

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter medicine name!"],
        trim: true
    },
    details: {
        type: String,
        required: [true, "Please enter medicine details!"],
        trim: true
    },
    companyName: {
        type: String,
        required: [true, "Please enter medicine company!"],
        trim: true
    },
    expiredDate: {
        type: Date,
        required: [true, "Please enter medicine expired date!"],
    },
    price: {
        type: Number,
        required: [true, "Please enter medicine price!"],
    },
    stocks: {
        type: Number,
        required: [true, "Please enter medicine stocks!"],
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
        required: true,
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

}, {
    timestamps: true
})

module.exports = mongoose.model('Medicines', medicineSchema)