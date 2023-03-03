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

  startTime: {
    type: Date,
    required: [true, "Please enter call start time!"],
  },
  endTime: {
    type: Date,
    default: null
  },
  callStatus: {
    type: String,
    enum: ['completed', 'missed', 'declined']
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