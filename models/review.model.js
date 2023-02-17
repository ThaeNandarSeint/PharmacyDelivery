const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
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
  text: {
    type: String,
    required: [true, "Please enter text for review"],
  },
  rating: {
    type: Number,
    enum: [ 0, 1, 2, 3, 4, 5 ]
  },

  pictureUrls: [
    {
      type: String,
      default: ''
    }
  ],
  picPublicIds: [
    {
      type: String,
      default: ''
    }
  ],
},
  {
    timestamps: true,
  }

);

module.exports = mongoose.model("Reviews", reviewSchema);