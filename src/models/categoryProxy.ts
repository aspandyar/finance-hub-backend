import * as categoryModel from './category.js';

export const CategoryModel = {
  getAllCategories: categoryModel.getAllCategories,
  getCategoryById: categoryModel.getCategoryById,
  getCategoriesByUserId: categoryModel.getCategoriesByUserId,
  createCategory: categoryModel.createCategory,
  updateCategory: categoryModel.updateCategory,
  deleteCategory: categoryModel.deleteCategory,
};

