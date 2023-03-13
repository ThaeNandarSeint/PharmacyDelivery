const mongoose = require("mongoose");

const deliveryPersonSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, "Please enter delivery person id!"],
    },

    name: {
      type: String,
      required: [true, "Please enter your name!"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Please enter your email!"],
      trim: true,
      unique: true
    },
    password: {
      type: String,
      required: [true, "Please enter your password!"]
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
      required: [true, "Please enter address!"],
    }

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DeliveryPersons", deliveryPersonSchema);
