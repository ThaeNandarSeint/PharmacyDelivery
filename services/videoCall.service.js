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

const createCallLog = async ({ callerId, calleeId, roomName, roomSid , callStatus}) => {

    let payload = { error: "" }

    try {
        // create custom id
        const id = await createCustomId(CallLogs, "C")
        if (id) {
            const newCallLog = new CallLogs({
                id, callerId, calleeId, roomSid, roomName, callStatus
            });

            savedCallLog = await newCallLog.save();
        }

    } catch (err) {
        payload.error = err.message

    } finally{
        return payload
    }
}

const updateCallLog = async ({ roomName, start, end, callStatus }) => {
    let payload = { error: "" }

    try {
        // let callDuration = 0

        if(callStatus === "completed"){
            const { startTime } = await CallLogs.findOne({ roomName })

            const duration = end.getTime() - startTime.getTime();
            const callDuration = Math.floor(duration / 1000);

            await CallLogs.updateOne({ roomName }, {
                startTime, endTime: end, callDuration, callStatus
            })
        }

        if(callStatus === "declined"){
            const duration = end.getTime() - start.getTime();
            const callDuration = Math.floor(duration / 1000);

            await CallLogs.updateOne({ roomName }, {
                startTime: start, endTime: end, callDuration, callStatus
            })
        }

        if(callStatus === "ongoing"){
            await CallLogs.updateOne({ roomName }, {
                startTime: start, endTime: null, callDuration: 0, callStatus
            })
        }

        if(callStatus === "missedCall"){
            const duration = end.getTime() - start.getTime();
            const callDuration = Math.floor(duration / 1000);

            await CallLogs.updateOne({ roomName }, {
                startTime: start, endTime: end, callDuration, callStatus
            })
        }

        // await CallLogs.updateOne({ roomName }, {
        //     startTime: start, endTime: end, callDuration, callStatus
        // })
        
        
        // // decline, callEnded
        // if(end){          
        //     const duration = end.getTime() - startTime.getTime();
        //     callDuration = Math.floor(duration / 1000);
        // }     

        // // callEnded
        // if(!startTime){
        //     await CallLogs.updateOne({ roomName }, {
        //         endTime, callDuration, callStatus
        //     })
        // }
        
        // // decline
        // await CallLogs.updateOne({ roomName }, {
        //     startTime, endTime, callDuration, callStatus
        // })

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

const checkCallStatus = async ({ roomName }) => {
    let payload = { callStatus: null, error: null }

    try{

        const { callStatus } = await CallLogs.findOne({ roomName })

        payload.callStatus = callStatus

    } catch(err) {
        payload.error = err.message

    } finally {
        return payload
    }
}

module.exports = {
    findOrCreateRoom,
    getAccessToken,
    createCallLog,
    updateCallLog,
    closeRoom,
    checkCallStatus
}