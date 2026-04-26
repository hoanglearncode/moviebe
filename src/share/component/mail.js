"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailService = exports.MailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const value_1 = require("../common/value");
class MailService {
    async send(input) {
        const transporter = this.getTransporter();
        await transporter.sendMail({
            from: this.getFromAddress(),
            to: input.to,
            subject: input.subject,
            html: input.html,
            text: input.text,
        });
    }
    getTransporter() {
        if (this.transporter) {
            return this.transporter;
        }
        if (!value_1.ENV.SMTP_HOST || !value_1.ENV.SMTP_USER || !value_1.ENV.SMTP_PASS || !value_1.ENV.MAIL_FROM_EMAIL) {
            throw new Error("Mail service is not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM_EMAIL.");
        }
        this.transporter = nodemailer_1.default.createTransport({
            host: value_1.ENV.SMTP_HOST,
            port: value_1.ENV.SMTP_PORT,
            secure: value_1.ENV.SMTP_SECURE,
            auth: {
                user: value_1.ENV.SMTP_USER,
                pass: value_1.ENV.SMTP_PASS,
            },
        });
        return this.transporter;
    }
    getFromAddress() {
        if (!value_1.ENV.MAIL_FROM_EMAIL) {
            throw new Error("MAIL_FROM_EMAIL is not configured.");
        }
        return `${value_1.ENV.MAIL_FROM_NAME} <${value_1.ENV.MAIL_FROM_EMAIL}>`;
    }
}
exports.MailService = MailService;
exports.mailService = new MailService();
