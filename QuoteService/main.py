import random
import time
from flask import Flask, jsonify, Response, request, g
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST, CollectorRegistry, ProcessCollector, PlatformCollector

QUOTES_FILE = "./quotes.txt"
quotes = []

registry = CollectorRegistry()
ProcessCollector(registry=registry)
PlatformCollector(registry=registry)

http_requests_total = Counter(
    'http_requests_total', 'Total number of HTTP requests received',
    ['method', 'path', 'status'], registry=registry
)
http_duration_seconds = Histogram(
    'http_duration_seconds', 'Duration of HTTP requests in seconds',
    ['method', 'path', 'status'],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registry=registry,
)
http_requests_in_flight = Gauge(
    'http_requests_in_flight', 'Number of HTTP requests currently being processed',
    registry=registry,
)


class Quote:
    def __init__(self, quote, by):
        self.quote = quote
        self.by = by


def load_quotes():
    with open(QUOTES_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            quote, by = line.split("-", 1)
            quotes.append(Quote(quote, by))


app = Flask(__name__)


@app.before_request
def _start_timer():
    if request.path == "/metrics":
        return
    g._prom_start = time.time()
    http_requests_in_flight.inc()


@app.after_request
def _record_metrics(response):
    if request.path == "/metrics":
        return response
    duration = time.time() - g.get("_prom_start", time.time())
    labels = (request.method, request.path, str(response.status_code))
    http_requests_total.labels(*labels).inc()
    http_duration_seconds.labels(*labels).observe(duration)
    http_requests_in_flight.dec()
    return response


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/metrics")
def metrics():
    return Response(generate_latest(registry), mimetype=CONTENT_TYPE_LATEST)


@app.route("/api/quote")
def quote():
    q = random.choice(quotes)
    return jsonify({"quote": q.quote, "by": q.by})


@app.errorhandler(404)
def not_found(e):
    return jsonify({"message": "Resource not found"}), 404


load_quotes()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
