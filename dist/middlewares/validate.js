"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const AppError_1 = __importDefault(require("../utils/AppError"));
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const message = error.issues.map((i) => i.message).join(', ');
                return next(new AppError_1.default(message, 400, 'VALIDATION_ERROR'));
            }
            next(error);
        }
    };
};
exports.validate = validate;
