const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, "Please enter category id!"],
  },
  title: {
    type: String,
    required: [true, "Please enter the category of the medicine"],
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
});

module.exports = mongoose.model("Categories", categorySchema);