const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, "Please enter order id!"],
    },

    orderDetails: [
        {
            medicine: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Medicines',
                default: ''
            },
            quantity: {
                type: Number,
                default: 0
            }
        }
    ],

    totalQuantity: {
        type: Number,
        default: 0
    },

    totalPrice: {
        type: Number,
        default: 0
    },

    deliveryPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPersons',
    },
    user: {
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
        type: String,
        required: [true, "Please enter customer address!"],
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Orders", orderSchema);