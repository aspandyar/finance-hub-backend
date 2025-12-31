import { Router } from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoriesByUserId,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';

const router = Router();

// Get all categories (with optional query params: user_id, type)
router.get('/', getCategories);

// Get categories by user ID
router.get('/user/:user_id', getCategoriesByUserId);

// Get category by ID
router.get('/:id', getCategoryById);

// Create a new category
router.post('/', createCategory);

// Update a category
router.put('/:id', updateCategory);

// Delete a category
router.delete('/:id', deleteCategory);

export default router;

