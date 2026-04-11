const errorHandler = (err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${status} - ${message}`);
  }

  res.status(status).json({ message });
};

module.exports = errorHandler;
