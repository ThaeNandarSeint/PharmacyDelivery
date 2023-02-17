const mongoose = require("mongoose");

const deliveryInfoSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, "Please enter delivery info id!"],
    },

    deliveryTime: {
        type: Number,
        default: 7
    },

    deliveryBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },

    deliveryFee: {
        type: Number,
        required: [true, "Please enter delivery fee!"],
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DeliveryInfos", deliveryInfoSchema);
