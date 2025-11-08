export function notFoundHandler(_req, res, _next) {
  res.status(404).json({ error: 'Not Found' })
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500
  const body = {
    error: err.message || 'Internal Server Error'
  }
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    body.stack = err.stack
  }
  res.status(status).json(body)
}








