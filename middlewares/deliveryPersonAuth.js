const jwt = require('jsonwebtoken')
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET

const DeliveryPersons = require('../models/deliveryPerson.model')

const deliveryPersonAuth = async (req, res, next) => {
    try {
        const accessToken = req.header('Authorization')

        if (!accessToken) {
            const error = new Error("Token expires or Token was not found! Please Login now!");
            error.status = 401;
            return next(error)
        }

        jwt.verify(accessToken, ACCESS_TOKEN_SECRET, async (err, user) => {
            if (err) {
                const error = new Error("Token expires or Incorrect token!");
                error.status = 401;
                return next(error)
            }

            const isDeliveryPerson = await DeliveryPersons.findById(user.id)
            if(!isDeliveryPerson){
                const error = new Error("You are not authorized for this action!");
                error.status = 403;
                return next(error)
            }

            req.user = user;
            next();

        })
    } catch (err) {
        next(err);
    }
}

module.exports = {
    deliveryPersonAuth
}