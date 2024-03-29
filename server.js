require("dotenv").config();
require("./db/conn");

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cors());
app.use(cookieParser());

app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// build server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  return res.status(200).json({ statusCode: 200, payload: {}, message: 'Server is running!' })
})

// routes
const authRoute = require("./routes/auth.route");
const userRoute = require("./routes/user.route");
const categoryRoute = require("./routes/category.route");
const medicineRoute = require("./routes/medicine.route");
const orderRoute = require("./routes/order.route");
const messageRoute = require("./routes/message.route");
const deliveryPersonRoute = require("./routes/deliveryPerson.route");
const reviewRoute = require("./routes/review.route");

const videoRoomRoute = require("./routes/videoRoom.route");

// middlewares
const { auth } = require("./middlewares/auth");

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/medicines", medicineRoute);
app.use("/api/orders", auth, orderRoute);
app.use("/api/messages", auth, messageRoute);

app.use("/api/deliveryPersons", deliveryPersonRoute);

app.use("/api/reviews", auth, reviewRoute);

app.use("/api/rooms", auth, videoRoomRoute);

// socket setup
const socket = require("socket.io");
const jwt = require('jsonwebtoken')
const { getAccessToken, createCallLog, closeRoom, updateCallLog, checkCallStatus } = require("./services/videoCall.service");

// models
const Users = require('./models/user.model');
const DeliveryPersons = require('./models/deliveryPerson.model');
const { default: mongoose } = require("mongoose");

const CLIENT_URL = process.env.CLIENT_URL;

const io = socket(server, {
  allowEIO3: true,
  cors: {
    origin: "*",
    credentials: true,
  },
});

app.set("socketIO", io)

io.use((socket, next) => {
  try {

    const accessToken = socket.handshake.auth.token || socket.handshake.headers.token;
    if (!accessToken) {
      const error = new Error("Token expires or Token was not found! Please Login now!");
      error.status = 401;
      return next(error)
    }

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      
      if (err) {
        const error = new Error("Token expires or Incorrect token!");
        error.status = 401;
        return next(error)
      }

      if(decoded.roleType === "DeliveryPerson"){
        const user = await DeliveryPersons.findById(decoded.id)

        if (!user) {
          const error = new Error("Token expires or Incorrect token!");
          error.status = 401;
          return next(error)
        }

        socket.user = user;
        socket.roleType = decoded.roleType

        return next()
      }

      const user = await Users.findById(decoded.id)

      if (!user) {
        const error = new Error("Token expires or Incorrect token!");
        error.status = 401;
        return next(error)
      }

      socket.user = user;
      socket.roleType = decoded.roleType

      next();
    });

  } catch (err) {
    next(err)
  }
})

io.on("connection", (socket) => {
  try {
    const user = socket.user
    const roleType = socket.roleType

    socket.join(user._id.toString());

    socket.emit("connected", { message: "connected" })

    socket.on("disconnect", () => {
      socket.emit('disconnected', { message: "disconnected" });
    });

    // click call btn
    socket.on("startCall", async ({ callerId, calleeId, roomName, roomSid }) => {
      if(callerId === "" || calleeId === "") {
        return console.log('required');
      }
      // const isUser = await Users.findById(calleeId)

      // let userType;
      // isUser ? userType = "Customer" : "DeliveryPerson"

      // if(userType === roleType){
      //   return console.log('cannot call');
      // }

      if (callerId !== calleeId) {

        const token = getAccessToken(roomName, calleeId)
        socket.to(calleeId).emit("calling", { roomName, token, caller: user, roomSid })

        await createCallLog({ callerId, calleeId, roomName, roomSid, callStatus: 'calling' })
      }

      const thirtySecond = 30 * 1000

      setTimeout(async () => {

        const { callStatus, error } = await checkCallStatus({ roomName })

        if (callStatus === "calling") {

          const start = new Date(Date.now())
          const end = new Date(Date.now())

          socket.emit('missedCall', { callerId, calleeId, roomName, roomSid })
          socket.to(calleeId).emit('missedCall', { callerId, calleeId, roomName, roomSid })

          await closeRoom({ sid: roomSid })

          const { error } = await updateCallLog({ roomName, start, end, callStatus: 'missedCall' })

          if (error) {
            console.log(error);
            // callback({ status: "not ok", message: error });
          }        

        }
        if (error) {
          // callback({ status: "not ok", message: error });
        }

      }, thirtySecond)

    });

    // click accept btn
    socket.on("acceptCall", async ({ callerId, calleeId, roomName, roomSid }) => {

      socket.to(callerId).emit("acceptCall", { callerId, calleeId, roomName, roomSid })

      const start = new Date(Date.now())

      const { error } = await updateCallLog({ roomName, start, callStatus: 'ongoing' })

      if (error) {
        // callback({ status: "not ok", message: error });
      }

    })

    // call end
    socket.on("callEnded", async ({ callerId, calleeId, roomSid, roomName }) => {

      console.log({ callerId, calleeId, roomSid, roomName });

      const participantDeclineId = socket.user._id.toString() //subject

      const declinedParticipantId = participantDeclineId === callerId ? calleeId : callerId; //object

      socket.to(declinedParticipantId).emit('callEnded', { roomSid, roomName })

      await closeRoom({ sid: roomSid })

      const end = new Date(Date.now())

      const { error } = await updateCallLog({ roomName, end, callStatus: 'completed' })
      console.log(error);

      if (error) {
        // callback({ status: "not ok", message: error });
      }

    })

    // click decline btn
    socket.on("declineCall", async ({ callerId, calleeId, roomSid, roomName }) => {

      const start = new Date(Date.now())
      const end = new Date(Date.now())

      socket.to(callerId).emit("declineCall", { callerId, calleeId, roomSid, roomName })

      await closeRoom({ sid: roomSid })

      const { error } = await updateCallLog({ roomName, start, end, callStatus: 'declined' })

      if (error) {
        // callback({ status: "not ok", message: error });
      }

    })

  } catch (err) {
    io.emit('error', { message: 'error' });
  }

});

// handle errors
app.use(morgan("dev"));
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  return res.status(error.status || 500).json({ statusCode: error.status || 500, payload: {}, message: error.message })
});
