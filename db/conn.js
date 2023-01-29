const mongoose = require('mongoose')

// connect to mongodb
const MONGODB_URL = process.env.MONGODB_URL
mongoose.set('strictQuery', true);

mongoose.connect(MONGODB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
})
.then(()=> {        
    console.log("Mongodb is connected")
})
.catch((err)=>console.log(err))