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

// // to upload file from form data
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// build server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// routes
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const medicineRoute = require("./routes/medicineRoute");
const categoryRoute = require("./routes/categoryRoute");
const roleRoute = require("./routes/roleRoute");
const permissionRoute = require("./routes/permissionRoute");

// middlewares
const { userAuth } = require("./middlewares/userAuth");

app.use("/api/auth", authRoute);
app.use("/api/users", userAuth, userRoute);
app.use("/api/medicines", medicineRoute);
app.use("/api/categories", userAuth, categoryRoute);
app.use("/api/roles", userAuth, roleRoute);
app.use("/api/permissions", userAuth, permissionRoute);

// handle errors
app.use(morgan("dev"));
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});
