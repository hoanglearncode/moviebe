"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const value_1 = require("../common/value");
cloudinary_1.v2.config({
    cloud_name: value_1.ENV.CLOUDINARY_CLOUD_NAME,
    api_key: value_1.ENV.CLOUDINARY_API_KEY,
    api_secret: value_1.ENV.CLOUDINARY_API_SECRET,
});
