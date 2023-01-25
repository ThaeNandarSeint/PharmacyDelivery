const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: [true, "Please enter order id!"],
    },

    medicines: [
        {
            medicineId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Medicines',
                required: true,
            },
            orderCount: {
                type: Number,
                required: true,
            }
        }
    ],

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },

    isPending: {
        type: Boolean,
        default: false
    },

    isDeliver: {
        type: Boolean,
        default: false
    },

    isCancel: {
        type: Boolean,
        default: false
    },
    cancelBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Orders", orderSchema);