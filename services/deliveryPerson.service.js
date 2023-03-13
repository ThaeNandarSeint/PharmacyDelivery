const DeliveryPerson = require('../models/deliveryPerson.model')

const createDeliveryPerson = async ({ id, name, email, password, pictureUrls, picPublicIds, roleType }) => {
    try{
        const newUser = new DeliveryPerson({
            id,
            name,
            email,
            password,
            pictureUrls,
            picPublicIds,
            roleType
        })
    
        const savedUser = await newUser.save()

        return savedUser

    } catch(err){
        return err
    }
}

const updateDeliveryPerson = async () => {

}

const deleteDeliveryPerson = async () => {

}

module.exports = {
    createDeliveryPerson
}