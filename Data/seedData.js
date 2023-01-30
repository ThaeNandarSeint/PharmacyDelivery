require("dotenv").config();
// const fs = require('fs');

// READ JSON FILE (data)
// const medicines = JSON.parse(
//   fs.readFileSync(`${__dirname}/medicines.json`, 'utf-8')
// );

// data
const { medicines } = require('./index')

// models
const Medicines = require('../models/medicineModel')

const insertData = async (Collection) => {
  try {
    if(Collection === "Medicines"){
      await Medicines.insertMany(medicines)      
    }

    console.log('Data successfully inserted!');

  } catch (err) {
    console.log(err.message);
  }

  process.exit();
}

const deleteData = async (Collection) => {
  try {
    if(Collection === "Medicines"){
      await Medicines.deleteMany()    
    }

    console.log('Data successfully deleted!');

  } catch (err) {
    console.log(err.message);
  }
  process.exit();
}

// node Data/seedData Medicines --import
const seedData = (Collection) => {  

  if (process.argv[3] === '--import') {

    insertData(Collection)
  
  } else if (process.argv[3] === '--delete') {
  
    deleteData(Collection);
  }
}

const mongoose = require('mongoose')
const MONGODB_URL = process.env.MONGODB_URL

mongoose.set('strictQuery', true);
mongoose.connect(MONGODB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
})
.then(()=> {        
    console.log("Mongodb is connected")
    seedData(process.argv[2])
})
.catch((err)=>console.log(err))

module.exports = {
  insertData,
  deleteData
}