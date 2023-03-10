const joi = require("joi");

const validation = joi.object({
  title: joi.string().trim(true).required(),
});

const categoryValidator = async (req, res, next) => {

  const payload = { title: req.body.title }

  const { error } = validation.validate(payload);

  if (error) {

    const err = new Error(error.message);
    err.status = 406;
    return next(err)

  } else {

    req.folderName = `PharmacyDelivery/Categories/${req.body.title.replace(/[^a-zA-Z0-9 ]/g, '')}`
    next();

  }
};

module.exports = {
  categoryValidator
};