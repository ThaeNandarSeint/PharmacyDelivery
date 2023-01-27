const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, "Please enter order id!"],
    },

    medicines: [
        {
            medicineId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Medicines',
                default: ''
            },
            orderCount: {
                type: Number,
                default: 0
            }
        }
    ],

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'confirm', 'deliver', 'complete', 'cancel'],
    },
    cancelBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Orders", orderSchema);