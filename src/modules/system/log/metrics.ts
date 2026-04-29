import client from "prom-client";

// collect default (CPU, RAM, GC)
client.collectDefaultMetrics();

// custom metric
export const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});

export const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Request duration",
  labelNames: ["method", "route", "status"],
});

export const register = client.register;
