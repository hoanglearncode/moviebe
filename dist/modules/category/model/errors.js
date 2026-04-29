"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrCategoryNameTooShort = exports.ErrCategoryNameDuplicate = void 0;
exports.ErrCategoryNameDuplicate = new Error("Category name already exists");
exports.ErrCategoryNameTooShort = new Error("Category name is too short");
