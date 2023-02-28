const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const { v4: uuidv4 } = require("uuid");
const { createCustomId } = require("./createCustomId");

const CallLogs = require('../models/callLog.model')

const twilioClient = require("twilio")(
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

const findOrCreateRoom = async (roomName) => {
    try {

        await twilioClient.video.v1.rooms(roomName).fetch()

    } catch (error) {

        if (error.code == 20404) {
            await twilioClient.video.v1.rooms.create({
                uniqueName: roomName,
                type: "go",
            });

        } else {
            throw error;
        }
    }
}

const getAccessToken = (roomName, userId) => {
    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY_SID,
        process.env.TWILIO_API_KEY_SECRET,

        { identity: userId }
    );

    const videoGrant = new VideoGrant({
        room: roomName,
    });


    token.addGrant(videoGrant);

    return token.toJwt();
};

const createCallLog = async ({ callerId, calleeId, roomName, roomSid, participantDeclineId }) => {
    try {
        const closedRoom = await twilioClient.video.v1.rooms.list({ uniqueName: roomName, status: 'completed' });

        const { dateCreated, endTime, duration } = closedRoom[0]

        // create custom id
        const id = await createCustomId(CallLogs, "C")
        if (id) {
            const newCallLog = new CallLogs({
                id, callerId, calleeId, roomSid, roomName, startTime: dateCreated, endTime, callDuration: duration, participantDeclineId
            });

            const savedCallLog = await newCallLog.save();

            return savedCallLog
        }

    } catch (err) {
        console.log(err);
    }
}

const closeRoom = async ({ sid }) => {
    try {
        const closedRoom = await twilioClient.video.v1.rooms(sid).update({ status: 'completed' })

        return closedRoom

    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    findOrCreateRoom,
    getAccessToken,
    createCallLog,
    closeRoom
}