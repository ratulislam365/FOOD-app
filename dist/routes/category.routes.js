"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const category_controller_1 = __importDefault(require("../controllers/category.controller"));
const authenticate_1 = require("../middlewares/authenticate");
const requireRole_1 = require("../middlewares/requireRole");
const validate_1 = require("../middlewares/validate");
const category_validation_1 = require("../validations/category.validation");
const router = express_1.default.Router();
// Rate limiting for provider management
const providerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many category operations, please try again after an hour',
    },
});
// All category routes require authentication and PROVIDER role
router.use(authenticate_1.authenticate);
router.use((0, requireRole_1.requireRole)(['PROVIDER']));
router.use(providerLimiter);
router
    .route('/')
    .post((0, validate_1.validate)(category_validation_1.createCategorySchema), category_controller_1.default.createCategory)
    .get(category_controller_1.default.getOwnCategories);
router
    .route('/:id')
    .patch((0, validate_1.validate)(category_validation_1.updateCategorySchema), category_controller_1.default.updateCategory)
    .delete((0, validate_1.validate)(category_validation_1.categoryIdSchema), category_controller_1.default.deleteCategory);
exports.default = router;
