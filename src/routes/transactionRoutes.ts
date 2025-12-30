import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  getTransactionsByUserId,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';

const router = Router();

// Get all transactions (with optional query params: user_id, type, category_id, start_date, end_date)
router.get('/', getTransactions);

// Get transactions by user ID
router.get('/user/:user_id', getTransactionsByUserId);

// Get transaction by ID
router.get('/:id', getTransactionById);

// Create a new transaction
router.post('/', createTransaction);

// Update a transaction
router.put('/:id', updateTransaction);

// Delete a transaction
router.delete('/:id', deleteTransaction);

export default router;

