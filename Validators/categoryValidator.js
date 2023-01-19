const joi = require("joi");

const { errorHandler } = require("./../helpers/errorHandler");

const validation = joi.object({
  title: joi.string().min(3).max(25).trim(true).required(),
});

const categoryValidator = async (req, res, next) => {
  const { title } = req.body;
  const payload = { title };

  const { error } = validation.validate(payload);

  if (error) {
    res.status(406);
    return res.json(
      errorHandler(true, `Error in Category Data : ${error.message}`)
    );
  } else {
    next();
  }
};

module.exports = categoryValidator;
