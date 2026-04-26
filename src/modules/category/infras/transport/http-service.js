"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryHttpService = void 0;
const dto_1 = require("../../../../modules/category/model/dto");
const http_server_1 = require("../../../../share/transport/http-server");
class CategoryHttpService extends http_server_1.BaseHttpService {
    constructor(useCase) {
        super(useCase);
    }
    async listAPI(req, res) {
        try {
            const paging = {
                page: 1,
                limit: 200,
            };
            const cond = dto_1.CategoryCondDTOSchema.parse(req.query);
            const result = await this.useCase.list(req.query, paging);
            const categoriesTree = this.buildTree(result);
            res.status(200).json({ data: categoriesTree, paging, filter: cond });
        }
        catch (error) {
            res.status(400).json({
                message: error.message,
            });
        }
    }
    buildTree(categories) {
        const categoriesTree = [];
        const mapChildren = new Map();
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            if (!mapChildren.get(category.id)) {
                mapChildren.set(category.id, []);
            }
            category.children = mapChildren.get(category.id);
            if (!category.parentId) {
                categoriesTree.push(category);
            }
            else {
                const children = mapChildren.get(category.parentId);
                children ? children.push(category) : mapChildren.set(category.parentId, [category]);
            }
        }
        return categoriesTree;
    }
}
exports.CategoryHttpService = CategoryHttpService;
