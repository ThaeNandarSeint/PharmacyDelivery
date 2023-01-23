const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicines',
        required: true,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },

    orderCount: {
        type: Number,
        required: [true, "Please enter order counts!"],
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
        required: true,
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Orders", orderSchema);