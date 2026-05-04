import random
import time
from flask import Flask, jsonify, Response

QUOTES_FILE = "./quotes.txt"
quotes = []
requests_total = 0
start_time = time.time()


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
def count_requests():
    global requests_total
    requests_total += 1


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/metrics")
def metrics():
    uptime = time.time() - start_time
    body = (
        "# HELP app_requests_total Total HTTP requests received\n"
        "# TYPE app_requests_total counter\n"
        f"app_requests_total {requests_total}\n"
        "# HELP app_uptime_seconds Process uptime in seconds\n"
        "# TYPE app_uptime_seconds gauge\n"
        f"app_uptime_seconds {uptime}\n"
    )
    return Response(body, mimetype="text/plain")


@app.route("/api/quote")
def quote():
    q = random.choice(quotes)
    return jsonify({"quote": q.quote, "by": q.by})


@app.errorhandler(404)
def not_found(e):
    return jsonify({"message": "Resource not found"}), 404


if __name__ == "__main__":
    load_quotes()
    app.run(host="0.0.0.0", port=5000)
