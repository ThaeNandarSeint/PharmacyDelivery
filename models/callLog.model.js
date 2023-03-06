const mongoose = require("mongoose");

const callLogSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, "Please enter callLog id!"],
  },
  callerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  calleeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },

  roomSid: {
    type: String,
    required: [true, "Please enter room sid!"],
  },
  roomName: {
    type: String,
    required: [true, "Please enter room name!"],
  },
  callStatus: {
    type: String,
    enum: ['calling', 'ongoing', 'completed', 'missed', 'declined']
  },

  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },

//   second
  callDuration: {
    type: Number,
    default: 0
  },
},

{
  timestamps: true,
}

);

module.exports = mongoose.model("CallLogs", callLogSchema);