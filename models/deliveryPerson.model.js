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

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DeliveryPersons", deliveryPersonSchema);
