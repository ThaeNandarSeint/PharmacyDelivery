const joi = require("joi");

const Users = require('../../models/user.model')

const validation = joi.object({
  text: joi.string().trim(true).required(),
});

const reviewValidator = async (req, res, next) => {

  const { name } = Users.findById(req.user.id)

  const payload = { text: req.body.text }

  const { error } = validation.validate(payload);

  if (error) {

    const err = new Error(error.message);
    err.status = 406;
    return next(err)

  } else {

    req.folderName = `PharmacyDelivery/Reviews/${name}`
    next();

  }
};

module.exports = {
  reviewValidator
};