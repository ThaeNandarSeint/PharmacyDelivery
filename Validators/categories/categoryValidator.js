const joi = require("joi");

const validation = joi.object({
  title: joi.string().min(3).max(25).trim(true).required(),
});

const categoryValidator = async (req, res, next) => {

  const payload = { title: req.body.title }

  const { error } = validation.validate(payload);

  if (error) {

    next(error)

  } else {

    req.folderName = `PharmacyDelivery/Categories/${req.body.title}`
    next();

  }
};

module.exports = {
  categoryValidator
};