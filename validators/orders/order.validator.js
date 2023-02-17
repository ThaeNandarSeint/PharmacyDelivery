const joi = require("joi");

const validation = joi.object({
  orderCount: joi.number().greater(0).required()
});

const orderValidator = async (req, res, next) => {

  const payload = { orderCount: req.body.orderCount }

  const { error } = validation.validate(payload);

  if (error) {

    const err = new Error(error.message);
    err.status = 406;
    return next(err)

  } else {

    next();

  }
};

module.exports = {
  orderValidator
};