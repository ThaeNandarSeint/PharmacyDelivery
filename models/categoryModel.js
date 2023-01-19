const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter the category of the medicine"],
  },
});

module.exports = mongoose.model("Categories", categorySchema);
