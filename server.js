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
const { userAuth } = require("./middlewares/userAuth");

app.use("/api/auth", authRoute);
app.use("/api/users", userAuth, userRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/medicines", medicineRoute);
app.use("/api/orders", userAuth, orderRoute);
app.use("/api/messages", userAuth, messageRoute);
app.use("/api/deliveryPersons", userAuth, deliveryPersonRoute);
app.use("/api/reviews", userAuth, reviewRoute);

app.use("/api/rooms", userAuth, videoRoomRoute);

// socket setup
const socket = require("socket.io");
const jwt = require('jsonwebtoken')
const { getAccessToken } = require("./services/videoCall.service");
const Users = require('./models/user.model')

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

    const user = await Users.findById(decoded.id)

    if(!user){
      const error = new Error("Token expires or Incorrect token!");
      error.status = 401;
      return next(error)
    }

    socket.user = user;

    next();
  });
})

io.on("connection", (socket) => {
  const user = socket.user

  socket.join(user._id.toString());

  socket.emit("connected", { message: "connected" })

  socket.on("disconnect", () => {
    socket.emit('disconnected');
  });

  // click call btn
  socket.on("start-call", async ({ callerId, calleeId, roomName }) => {    
    if(callerId !== calleeId){
      const token = getAccessToken(roomName, calleeId)
      socket.to(calleeId).emit("calling", { roomName, token, caller: user })
    }
  });

  // click accept btn
  socket.on("accept-call", ({ callerId, calleeId, roomName }) => {
    // socket.to(calleeId).emit("accept-call", { callerId, calleeId, roomName })
  })

  // click decline btn
  socket.on("decline-call", ({ callerId, calleeId, roomName }) => {
    // socket.to(calleeId).emit("decline-call", { callerId, calleeId, roomName })
  })

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
