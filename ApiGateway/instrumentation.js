const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const httpDurationSeconds = new client.Histogram({
  name: 'http_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

const httpRequestsInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  registers: [register]
});

const trackRequest = (req, res, next) => {
  if (req.path === '/metrics') return next();

  httpRequestsInFlight.inc();
  const end = httpDurationSeconds.startTimer({ method: req.method, path: req.path });

  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode });
    end({ status: res.statusCode });
    httpRequestsInFlight.dec();
  });

  next();
};

module.exports = { register, trackRequest, httpRequestsTotal, httpDurationSeconds };
