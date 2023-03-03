const mongoose = require("mongoose");

const orderDetailSchema = new mongoose.Schema({
    // id: {
    //     type: String,
    //     required: [true, "Please enter order detail id!"],
    // },
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicines',
        default: ''
    },
    quantity: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("OrderDetails", orderDetailSchema);