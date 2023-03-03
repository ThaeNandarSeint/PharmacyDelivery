const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, "Please enter order id!"],
    },

    orderDetails: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OrderDetails',
            default: ''
        },
    ],

    totalQuantity: {
        type: Number,
        default: 0
    },

    totalPrice: {
        type: Number,
        default: 0
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'deliver', 'complete', 'cancel'],
    },
    cancelBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    },

    address: {
        buildingNo: {
            type: String,
            required: [true, "Please enter building number!"],
        },
        street: {
            type: String,
            required: [true, "Please enter street name!"],
        },
        quarter: {
            type: String,
            required: [true, "Please enter quarter name!"],
        },
        township: {
            type: String,
            required: [true, "Please enter township name!"],
        },
        city: {
            type: String,
            required: [true, "Please enter city name!"],
        },
        state: {
            type: String,
            required: [true, "Please enter state name!"],
        }
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Orders", orderSchema);