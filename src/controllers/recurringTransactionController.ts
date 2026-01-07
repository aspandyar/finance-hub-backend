import type { Request, Response, NextFunction } from 'express';
import { RecurringTransactionModel } from '../models/models.js';
import { handleForeignKeyError } from '../utils/prismaErrors.js';
import { isValidUUID, isValidDate } from '../validations/common.js';
import { validateCreateRecurringTransaction, validateUpdateRecurringTransaction } from '../validations/recurringTransaction.js';
import type { TransactionType, FrequencyType } from '../models/recurringTransaction.js';


// Create a recurring transaction
export const createRecurringTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      category_id,
      amount,
      type,
      description,
      frequency,
      start_date,
      end_date,
      next_occurrence,
      is_active,
    } = req.body;

    // Use authenticated user's ID (users can only create recurring transactions for themselves)
    const user_id = req.user.id;

    // Validate all fields
    if (!(await validateCreateRecurringTransaction({
      category_id,
      amount,
      type,
      frequency,
      start_date,
      end_date,
      next_occurrence,
      description,
      is_active,
    }, res))) {
      return;
    }

    const recurringTransaction =
      await RecurringTransactionModel.createRecurringTransaction({
        user_id,
        category_id,
        amount,
        type,
        description: description || null,
        frequency,
        start_date,
        end_date: end_date || null,
        next_occurrence,
        is_active: is_active !== undefined ? is_active : true,
      });

    res.status(201).json(recurringTransaction);
  } catch (error: any) {
    // Handle foreign key constraint violations
    if (handleForeignKeyError(error, res)) {
      return;
    }
    next(error);
  }
};

// Get all recurring transactions (optionally filtered by query params)
export const getRecurringTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { is_active } = req.query;

    // Regular users can only see their own recurring transactions
    // Admin and manager can see all recurring transactions
    let parsedUserId: string | undefined = undefined;
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      // Admin/manager can filter by any user_id or see all
      const { user_id } = req.query;
      if (user_id !== undefined) {
        if (typeof user_id === 'string' && isValidUUID(user_id)) {
          parsedUserId = user_id;
        } else {
          return res.status(400).json({ error: 'Invalid user ID format' });
        }
      }
    } else {
      // Regular users can only see their own recurring transactions
      parsedUserId = req.user.id;
    }

    let parsedIsActive: boolean | undefined = undefined;
    if (is_active !== undefined) {
      if (typeof is_active === 'string') {
        if (is_active === 'true') {
          parsedIsActive = true;
        } else if (is_active === 'false') {
          parsedIsActive = false;
        } else {
          return res.status(400).json({ error: 'is_active must be true or false' });
        }
      } else {
        return res.status(400).json({ error: 'is_active must be a string' });
      }
    }

    const recurringTransactions =
      await RecurringTransactionModel.getAllRecurringTransactions(
        parsedUserId,
        parsedIsActive
      );
    res.json(recurringTransactions);
  } catch (error) {
    next(error);
  }
};

// Get recurring transaction by ID
export const getRecurringTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id || !isValidUUID(id)) {
      return res
        .status(400)
        .json({ error: 'Invalid recurring transaction ID format' });
    }

    const recurringTransaction =
      await RecurringTransactionModel.getRecurringTransactionById(id);
    if (!recurringTransaction) {
      return res
        .status(404)
        .json({ message: 'Recurring transaction not found' });
    }

    res.json(recurringTransaction);
  } catch (error) {
    next(error);
  }
};

// Get recurring transactions by user ID
export const getRecurringTransactionsByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { user_id } = req.params;

    if (!user_id || !isValidUUID(user_id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Regular users can only see their own recurring transactions
    // Admin and manager can see any user's recurring transactions
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own recurring transactions',
        });
      }
    }

    const recurringTransactions =
      await RecurringTransactionModel.getRecurringTransactionsByUserId(user_id);
    res.json(recurringTransactions);
  } catch (error) {
    next(error);
  }
};

// Get due recurring transactions (for a specific date)
export const getDueRecurringTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { date } = req.query;

    let parsedDate: string | undefined = undefined;
    if (date !== undefined) {
      if (typeof date === 'string' && isValidDate(date)) {
        parsedDate = date;
      } else {
        return res
          .status(400)
          .json({ error: 'Invalid date format (expected: YYYY-MM-DD)' });
      }
    } else {
      // Default to today if no date provided
      const today = new Date();
      parsedDate = today.toISOString().split('T')[0]!;
    }

    const recurringTransactions =
      await RecurringTransactionModel.getDueRecurringTransactions(parsedDate);
    res.json(recurringTransactions);
  } catch (error) {
    next(error);
  }
};

// Update a recurring transaction
export const updateRecurringTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    if (!id || !isValidUUID(id)) {
      return res
        .status(400)
        .json({ error: 'Invalid recurring transaction ID format' });
    }

    // Check ownership or role
    const existingRecurringTransaction =
      await RecurringTransactionModel.getRecurringTransactionById(id);
    if (!existingRecurringTransaction) {
      return res
        .status(404)
        .json({ message: 'Recurring transaction not found' });
    }

    // Check if user owns the recurring transaction or is admin/manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (existingRecurringTransaction.userId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own recurring transactions',
        });
      }
    }

    const {
      category_id,
      amount,
      type,
      description,
      frequency,
      start_date,
      end_date,
      next_occurrence,
      is_active,
    } = req.body;

    // Build update object, only including defined properties
    const updateData: {
      category_id?: string;
      amount?: number;
      type?: TransactionType;
      description?: string | null;
      frequency?: FrequencyType;
      start_date?: string;
      end_date?: string | null;
      next_occurrence?: string;
      is_active?: boolean;
    } = {};

    // Validate all fields
    if (!(await validateUpdateRecurringTransaction(
      {
        category_id,
        amount,
        type,
        frequency,
        start_date,
        end_date,
        next_occurrence,
        description,
        is_active,
      },
      existingRecurringTransaction.categoryId,
      existingRecurringTransaction.type,
      res
    ))) {
      return;
    }

    // Build update object, only including defined properties
    if (category_id !== undefined) {
      updateData.category_id = category_id;
    }
    if (amount !== undefined) {
      updateData.amount = amount;
    }
    if (type !== undefined) {
      updateData.type = type;
    }
    if (frequency !== undefined) {
      updateData.frequency = frequency;
    }
    if (start_date !== undefined) {
      updateData.start_date = start_date;
    }
    if (end_date !== undefined) {
      updateData.end_date = end_date;
    }
    if (next_occurrence !== undefined) {
      updateData.next_occurrence = next_occurrence;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const recurringTransaction =
      await RecurringTransactionModel.updateRecurringTransaction(id, updateData);

    if (!recurringTransaction) {
      return res
        .status(404)
        .json({ message: 'Recurring transaction not found' });
    }

    res.json(recurringTransaction);
  } catch (error: any) {
    // Handle foreign key constraint violations
    if (handleForeignKeyError(error, res)) {
      return;
    }
    next(error);
  }
};

// Delete a recurring transaction
export const deleteRecurringTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    if (!id || !isValidUUID(id)) {
      return res
        .status(400)
        .json({ error: 'Invalid recurring transaction ID format' });
    }

    // Check ownership or role
    const existingRecurringTransaction =
      await RecurringTransactionModel.getRecurringTransactionById(id);
    if (!existingRecurringTransaction) {
      return res
        .status(404)
        .json({ message: 'Recurring transaction not found' });
    }

    // Check if user owns the recurring transaction or is admin/manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (existingRecurringTransaction.userId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own recurring transactions',
        });
      }
    }

    const deleted =
      await RecurringTransactionModel.deleteRecurringTransaction(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: 'Recurring transaction not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

