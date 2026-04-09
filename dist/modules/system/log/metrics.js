"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.httpDuration = exports.httpRequestCounter = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
// collect default (CPU, RAM, GC)
prom_client_1.default.collectDefaultMetrics();
// custom metric
exports.httpRequestCounter = new prom_client_1.default.Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status"],
});
exports.httpDuration = new prom_client_1.default.Histogram({
    name: "http_request_duration_seconds",
    help: "Request duration",
    labelNames: ["method", "route", "status"],
});
exports.register = prom_client_1.default.register;
