import * as userModel from './user.js';
import * as categoryModel from './category.js';
import * as transactionModel from './transaction.js';

export const UserModel = {
  getAllUsers: userModel.getAllUsers,
  createUser: userModel.createUser,
  getUserById: userModel.getUserById,
  getUserByEmail: userModel.getUserByEmail,
  updateUser: userModel.updateUser,
  deleteUser: userModel.deleteUser,
};

export const CategoryModel = {
  getAllCategories: categoryModel.getAllCategories,
  getCategoryById: categoryModel.getCategoryById,
  getCategoriesByUserId: categoryModel.getCategoriesByUserId,
  createCategory: categoryModel.createCategory,
  updateCategory: categoryModel.updateCategory,
  deleteCategory: categoryModel.deleteCategory,
};

export const TransactionModel = {
  getAllTransactions: transactionModel.getAllTransactions,
  getTransactionById: transactionModel.getTransactionById,
  getTransactionsByUserId: transactionModel.getTransactionsByUserId,
  createTransaction: transactionModel.createTransaction,
  updateTransaction: transactionModel.updateTransaction,
  deleteTransaction: transactionModel.deleteTransaction,
};

