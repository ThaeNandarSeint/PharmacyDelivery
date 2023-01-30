const joi = require("joi");

const Users = require('../../models/userModel')

const validation = joi.object({
  text: joi.string().trim(true).required(),
});

const reviewValidator = async (req, res, next) => {

    const { name } = Users.findById(req.user.id)

  const payload = { text: req.body.text }

  const { error } = validation.validate(payload);

  if (error) {

    return res.status(406).json({ status: 406, msg: error.message });

  } else {

    req.folderName = `PharmacyDelivery/Reviews/${name}`
    next();

  }
};

module.exports = {
    reviewValidator
};