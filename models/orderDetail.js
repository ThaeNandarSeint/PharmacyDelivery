const mongoose = require("mongoose");

const orderDetailSchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicines',
        required: true,
    },
    orderCount: {
        type: Number,
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Orders',
        required: true,
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("OrderDetails", orderDetailSchema);