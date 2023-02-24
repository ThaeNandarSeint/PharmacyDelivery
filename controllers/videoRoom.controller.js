const { v4: uuidv4 } = require("uuid");

const { getAccessToken } = require("../services/videoCall.service");

const twilioClient = require("twilio")(
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

const createRoom = async (req, res, next) => {
    try {
        const roomName = uuidv4()
        const userId = req.user.id

        const room = await twilioClient.video.v1.rooms.create({
            uniqueName: roomName,
            type: 'go'
        });

        const token = getAccessToken(roomName, userId)

        console.log(room);

        return res.status(200).json({ statusCode: 200, payload: { roomName: room.uniqueName, roomSid: room.sid, token }, message: "" })

    } catch (err) {
        if (err.message === "identity is required to be specified in options") {
            const error = new Error("This user already exists in room");
            error.status = 400;
            return next(error)
        }
        next(err)
    }
}

const getAllRooms = async (req, res, next) => {
    try {
        const rooms = await twilioClient.video.v1.rooms.list({ status: 'in-progress', limit: 20 });

        if (!rooms.length) {
            return res.status(200).json({ statusCode: 200, payload: { activeRooms: rooms }, message: "No active rooms found" })
        }

        let activeRooms = [];

        rooms.forEach((room) => {
            const roomData = {
                sid: room.sid,
                name: room.uniqueName
            }

            activeRooms.push(roomData);
        });

        return res.status(200).json({ statusCode: 200, payload: { activeRooms }, message: "" })

    } catch (err) {
        next(err)
    }
}

const getByRoomSid = async (req, res, next) => {
    const { sid } = req.params

    try {
        const room = await twilioClient.video.v1.rooms(sid).fetch();

        return res.status(200).json({ room });

    } catch (err) {
        next(err)
    }
}

const closeRoom = async (req, res, next) => {

    const { sid } = req.params

    try {

        const room = await twilioClient.video.v1.rooms(sid).update({ status: 'completed' })

        const closedRoom = {
            sid: room.sid,
            name: room.uniqueName,
        }

        return res.status(200).json({ statusCode: 200, payload: { closedRoom }, message: "" })

    } catch (error) {
        next(err)
    }
}


module.exports = {
    createRoom,
    getAllRooms,
    getByRoomSid,
    closeRoom
}