import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import {
  createRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionById,
  getRecurringTransactionsByUserId,
  getDueRecurringTransactions,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '../controllers/recurringTransactionController.js';
import { RecurringTransactionModel } from '../models/models.js';
import type { RecurringTransaction } from '../models/recurringTransaction.js';

// Mock dependencies
jest.mock('../models/models.js');

describe('Recurring Transaction Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseStatus: jest.Mock;
  let responseJson: jest.Mock;

  const mockCreateRecurringTransaction = RecurringTransactionModel.createRecurringTransaction as jest.MockedFunction<typeof RecurringTransactionModel.createRecurringTransaction>;
  const mockGetAllRecurringTransactions = RecurringTransactionModel.getAllRecurringTransactions as jest.MockedFunction<typeof RecurringTransactionModel.getAllRecurringTransactions>;
  const mockGetRecurringTransactionById = RecurringTransactionModel.getRecurringTransactionById as jest.MockedFunction<typeof RecurringTransactionModel.getRecurringTransactionById>;
  const mockGetRecurringTransactionsByUserId = RecurringTransactionModel.getRecurringTransactionsByUserId as jest.MockedFunction<typeof RecurringTransactionModel.getRecurringTransactionsByUserId>;
  const mockGetDueRecurringTransactions = RecurringTransactionModel.getDueRecurringTransactions as jest.MockedFunction<typeof RecurringTransactionModel.getDueRecurringTransactions>;
  const mockUpdateRecurringTransaction = RecurringTransactionModel.updateRecurringTransaction as jest.MockedFunction<typeof RecurringTransactionModel.updateRecurringTransaction>;
  const mockDeleteRecurringTransaction = RecurringTransactionModel.deleteRecurringTransaction as jest.MockedFunction<typeof RecurringTransactionModel.deleteRecurringTransaction>;

  beforeEach(() => {
    responseStatus = jest.fn().mockReturnThis();
    responseJson = jest.fn().mockReturnThis();

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: responseStatus as any,
      json: responseJson as any,
      send: jest.fn() as any,
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createRecurringTransaction', () => {
    it('should create recurring transaction successfully', async () => {
      const transactionData = {
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100.50,
        type: 'expense' as const,
        description: 'Monthly subscription',
        frequency: 'monthly' as const,
        start_date: '2024-01-01',
        end_date: null,
        next_occurrence: '2024-02-01',
        is_active: true,
      };

      const createdTransaction: RecurringTransaction = {
        id: 'recurring-123',
        user_id: 'user-123',
        category_id: transactionData.category_id,
        amount: transactionData.amount.toString(), // DECIMAL returned as string
        type: transactionData.type,
        description: transactionData.description,
        frequency: transactionData.frequency,
        start_date: transactionData.start_date,
        end_date: transactionData.end_date,
        next_occurrence: transactionData.next_occurrence,
        is_active: transactionData.is_active,
        created_at: new Date(),
      };

      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.body = transactionData;
      mockCreateRecurringTransaction.mockResolvedValue(createdTransaction);
 
      await createRecurringTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCreateRecurringTransaction).toHaveBeenCalledWith({
        user_id: 'user-123',
        ...transactionData,
      });
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(createdTransaction);
    });

    it('should return 401 when not authenticated', async () => {
      delete mockRequest.user;

      await createRecurringTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should return 400 for invalid category_id', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.body = {
        category_id: 'invalid-uuid',
        amount: 100,
        type: 'expense',
        frequency: 'monthly',
        start_date: '2024-01-01',
        next_occurrence: '2024-02-01',
      };

      await createRecurringTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Valid category ID is required' });
    });

    it('should return 400 for invalid type', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.body = {
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100,
        type: 'invalid',
        frequency: 'monthly',
        start_date: '2024-01-01',
        next_occurrence: '2024-02-01',
      };

      await createRecurringTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        error: "Transaction type must be 'income' or 'expense'",
      });
    });

    it('should return 400 for invalid frequency', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.body = {
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100,
        type: 'expense',
        frequency: 'invalid',
        start_date: '2024-01-01',
        next_occurrence: '2024-02-01',
      };

      await createRecurringTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid date format', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.body = {
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100,
        type: 'expense',
        frequency: 'monthly',
        start_date: 'invalid-date',
        next_occurrence: '2024-02-01',
      };

      await createRecurringTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('getRecurringTransactions', () => {
    it('should return recurring transactions for authenticated user', async () => {
      const transactions: RecurringTransaction[] = [
        {
          id: 'recurring-1',
          user_id: 'user-123',
          category_id: 'cat-1',
          amount: '100',
          type: 'expense' as const,
          description: null,
          frequency: 'monthly' as const,
          start_date: '2024-01-01',
          end_date: null,
          next_occurrence: '2024-02-01',
          is_active: true,
          created_at: new Date(),
        },
      ];

      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
      mockGetAllRecurringTransactions.mockResolvedValue(transactions);
    
      await getRecurringTransactions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetAllRecurringTransactions).toHaveBeenCalledWith('user-123', undefined);
      expect(responseJson).toHaveBeenCalledWith(transactions);
    });

    it('should filter by is_active when provided', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.query = { is_active: 'true' };

      await getRecurringTransactions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetAllRecurringTransactions).toHaveBeenCalledWith('user-123', true);
    });
  });

  describe('getRecurringTransactionById', () => {
    it('should return recurring transaction by id', async () => {
      const transaction: RecurringTransaction = {
        id: 'recurring-123',
        user_id: 'user-123',
        category_id: 'cat-1',
        amount: '100',
        type: 'expense' as const,
        description: null,
        frequency: 'monthly' as const,
        start_date: '2024-01-01',
        end_date: null,
        next_occurrence: '2024-02-01',
        is_active: true,
        created_at: new Date(),
      };

      mockRequest.params = { id: 'recurring-123' };
      mockGetRecurringTransactionById.mockResolvedValue(transaction);

      await getRecurringTransactionById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetRecurringTransactionById).toHaveBeenCalledWith('recurring-123');
      expect(responseJson).toHaveBeenCalledWith(transaction);
    });

    it('should return 404 when transaction not found', async () => {
      mockRequest.params = { id: 'recurring-123' };
      mockGetRecurringTransactionById.mockResolvedValue(null);

      await getRecurringTransactionById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('getDueRecurringTransactions', () => {
    it('should return due transactions for specified date', async () => {
      const transactions: RecurringTransaction[] = [
        {
          id: 'recurring-1',
          user_id: 'user-123',
          category_id: 'cat-1',
          amount: '100',
          type: 'expense' as const,
          description: null,
          frequency: 'monthly' as const,
          start_date: '2024-01-01',
          end_date: null,
          next_occurrence: '2024-02-01',
          is_active: true,
          created_at: new Date(),
        },
      ];

      mockRequest.query = { date: '2024-02-01' };
      mockGetDueRecurringTransactions.mockResolvedValue(transactions);

      await getDueRecurringTransactions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetDueRecurringTransactions).toHaveBeenCalledWith('2024-02-01');
      expect(responseJson).toHaveBeenCalledWith(transactions);
    });

    it('should use today as default when date not provided', async () => {
      const today = new Date().toISOString().split('T')[0]!;
      mockRequest.query = {};

      await getDueRecurringTransactions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetDueRecurringTransactions).toHaveBeenCalledWith(today);
    });
  });

  describe('updateRecurringTransaction', () => {
    it('should update recurring transaction successfully', async () => {
      const existingTransaction: RecurringTransaction = {
        id: 'recurring-123',
        user_id: 'user-123',
        category_id: 'cat-1',
        amount: '100',
        type: 'expense' as const,
        description: null,
        frequency: 'monthly' as const,
        start_date: '2024-01-01',
        end_date: null,
        next_occurrence: '2024-02-01',
        is_active: true,
        created_at: new Date(),
      };

      const updatedTransaction: RecurringTransaction = {
        ...existingTransaction,
        amount: '150',
      };

      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.params = { id: 'recurring-123' };
      mockRequest.body = { amount: 150 };
      mockGetRecurringTransactionById.mockResolvedValue(existingTransaction);
      mockUpdateRecurringTransaction.mockResolvedValue(updatedTransaction);

      await updateRecurringTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUpdateRecurringTransaction).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith(updatedTransaction);
    });

    it('should return 403 when user does not own transaction', async () => {
      const existingTransaction: RecurringTransaction = {
        id: 'recurring-123',
        user_id: 'other-user-123',
        category_id: 'cat-1',
        amount: '100',
        type: 'expense' as const,
        description: null,
        frequency: 'monthly' as const,
        start_date: '2024-01-01',
        end_date: null,
        next_occurrence: '2024-02-01',
        is_active: true,
        created_at: new Date(),
      };

      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.params = { id: 'recurring-123' };
      mockGetRecurringTransactionById.mockResolvedValue(existingTransaction);

      await updateRecurringTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteRecurringTransaction', () => {
    it('should delete recurring transaction successfully', async () => {
      const existingTransaction: RecurringTransaction = {
        id: 'recurring-123',
        user_id: 'user-123',
        category_id: 'cat-1',
        amount: '100',
        type: 'expense' as const,
        description: null,
        frequency: 'monthly' as const,
        start_date: '2024-01-01',
        end_date: null,
        next_occurrence: '2024-02-01',
        is_active: true,
        created_at: new Date(),
      };

      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.params = { id: 'recurring-123' };
      mockGetRecurringTransactionById.mockResolvedValue(existingTransaction);
      mockDeleteRecurringTransaction.mockResolvedValue(true);

      await deleteRecurringTransaction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockDeleteRecurringTransaction).toHaveBeenCalledWith('recurring-123');
      expect(responseStatus).toHaveBeenCalledWith(204);
    });
  });
});

