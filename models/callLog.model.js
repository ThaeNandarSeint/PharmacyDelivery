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
  participantDeclineId: {
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
    required: [true, "Please enter call end time!"],
  },

//   second
  callDuration: {
    type: Number,
    required: [true, "Please enter call duration!"],
  },
},

{
  timestamps: true,
}

);

module.exports = mongoose.model("CallLogs", callLogSchema);