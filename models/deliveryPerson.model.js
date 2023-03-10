const mongoose = require("mongoose");

const deliveryPersonSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, "Please enter delivery boy id!"],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    phoneNumber: {
        type: String,
        required: [true, "Please enter phone number!"],
    },

    vehicleType: {
        type: String,
        enum: ['bike', 'car'],
    },
    vehicleNumber: {
        type: String,
        required: [true, "Please enter vehicle number!"],
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
    },

    address: {
        type: String,
        required: [true, "Please enter customer address!"],
    }

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DeliveryPersons", deliveryPersonSchema);
