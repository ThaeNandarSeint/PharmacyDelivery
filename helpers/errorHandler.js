const errorHandler = (isError, message) => {
  if (isError) return { isError, message };
};

module.exports = {
  errorHandler,
};
