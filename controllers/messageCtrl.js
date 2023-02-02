const Messages = require("../models/messageModel");

// get all messages
 const getMessages = async (req, res, next) => {
    try {
        
        const { from, to } = req.body;

        const messages = await Messages.find({
            users: { $all: [ from, to ] },
        }).sort({ updatedAt: 1 });

        const projectedMessages = messages.map((msg) => {
            let date = (msg.createdAt).getDate()    
            let month = (msg.createdAt).getMonth() + 1
            const year = (msg.createdAt).getFullYear()

            if(date < 10){
                date = `0${date}`
            }
            if(month < 10){
                month = `0${month}`
            }
            const createdDate = `${date}/${month}/${year}`

            let hours = (msg.createdAt).getHours()
            let minutes = (msg.createdAt).getMinutes()
            let seconds = (msg.createdAt).getSeconds()   
            if(minutes === 0){
                minutes = 00
            } 
            if(minutes < 10){
                minutes = `0${minutes}`
            }
            // 13PM to 23 PM
            if(hours > 12){
                hours = hours - 12
                hours = `${hours}:${minutes} PM`
            }
            // 24 (night 12)
            if(hours === 0){
                hours = `12:${minutes} AM`
            }
            // morning
            if(hours < 12){
                hours = `${hours}:${minutes} AM`
            }
            // noon 12
            if(hours === 12){
                hours = `12:${minutes} PM`
            }
                
            return {
                fromSelf: msg.sender.toString() === from,
                message: msg.message.text,
                createdDate,
                createdTime: hours
            };
        });

        return res.status(200).json({ status: 200, projectedMessages })

    } catch (err) {
        next(err);
    }
};

// add message
const createMessage = async (req, res, next) => {
    try {
        const { from, to, message } = req.body;

        const newMessage = new Messages({
            message: { text: message },
            users: [from, to],
            sender: from,
        })

        const savedMessage = await newMessage.save()

        return res.status(201).json({ status: 201, messageId: savedMessage._id, msg: "New message has been successfully added!" })

    } catch (ex) {
        next(ex);
    }
};
module.exports = {
    getMessages,
    createMessage
}