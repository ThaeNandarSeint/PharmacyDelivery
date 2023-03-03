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

    try{

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

    }catch(err){
        next(err)
    } 
};

const createCallLog = async ({ callerId, calleeId, roomName, roomSid }) => {

    let payload = { error: "" }

    try {

        const startTime = new Date(Date.now())
        const endTime = new Date(Date.now())
        // create custom id
        const id = await createCustomId(CallLogs, "C")
        if (id) {
            const newCallLog = new CallLogs({
                id, callerId, calleeId, roomSid, roomName, startTime, endTime
            });

            savedCallLog = await newCallLog.save();
        }

    } catch (err) {
        payload.error = err.message

    } finally{
        return payload
    }
}

const updateCallLog = async ({ roomName }) => {
    let payload = { error: "" }

    try {
        const { startTime } = await CallLogs.findOne({ roomName })

        const endTime = new Date(Date.now())

        const duration = endTime.getTime() - startTime.getTime();
        const durationInSeconds = Math.floor(duration / 1000);

        await CallLogs.updateOne({ roomName }, {
            endTime, callDuration: durationInSeconds
        })

    } catch (err) {
        payload.error = err.message

    } finally{
        return payload
    }
}

const closeRoom = async ({ sid }) => {
    let payload = { error: "" }

    try {
        const closedRoom = await twilioClient.video.v1.rooms(sid).update({ status: 'completed' })

        return closedRoom

    } catch (err) {
        payload.error = err.message

    } finally{
        return payload
    }
}

module.exports = {
    findOrCreateRoom,
    getAccessToken,
    createCallLog,
    updateCallLog,
    closeRoom
}