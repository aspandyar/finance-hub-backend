import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
} from '../controllers/authController.js';
import { UserModel } from '../models/models.js';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import type { User } from '../models/user.js';

// Mock dependencies
jest.mock('../models/models.js');
jest.mock('../utils/password.js');
jest.mock('../utils/jwt.js');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseStatus: jest.Mock;
  let responseJson: jest.Mock;

  const mockGetUserByEmail = UserModel.getUserByEmail as jest.MockedFunction<typeof UserModel.getUserByEmail>;
  const mockCreateUser = UserModel.createUser as jest.MockedFunction<typeof UserModel.createUser>;
  const mockGetUserById = UserModel.getUserById as jest.MockedFunction<typeof UserModel.getUserById>;
  const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
  const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
  const mockValidatePassword = validatePassword as jest.MockedFunction<typeof validatePassword>;
  const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

  beforeEach(() => {
    responseStatus = jest.fn().mockReturnThis();
    responseJson = jest.fn().mockReturnThis();

    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: responseStatus as any,
      json: responseJson as any,
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        full_name: 'Test User',
        currency: 'USD',
      };

      const hashedPassword = 'hashed-password';
      const createdUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        currency: 'USD',
        role: 'user',
        password_hash: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const token = 'jwt-token';

      mockRequest.body = userData;
      mockValidatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockGetUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(hashedPassword);
      mockCreateUser.mockResolvedValue(createdUser);
      mockGenerateToken.mockReturnValue(token);

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockValidatePassword).toHaveBeenCalledWith('TestPass123!');
      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockHashPassword).toHaveBeenCalledWith('TestPass123!');
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password_hash: hashedPassword,
        full_name: 'Test User',
        currency: 'USD',
        role: 'user',
      });
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
          full_name: 'Test User',
        }),
        token,
      });
    });

    it('should return 400 for invalid email', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: 'TestPass123!',
        full_name: 'Test User',
      };

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Valid email is required' });
    });

    it('should return 400 for missing password', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        full_name: 'Test User',
      };

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Password is required' });
    });

    it('should return 400 for weak password', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'weak',
        full_name: 'Test User',
      };

      mockValidatePassword.mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters long'],
      });

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Password does not meet requirements',
        details: ['Password must be at least 8 characters long'],
      });
    });

    it('should return 400 for missing full_name', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'TestPass123!',
      };

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Full name is required' });
    });

    it('should return 400 for full_name exceeding 100 characters', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'TestPass123!',
        full_name: 'A'.repeat(101),
      };

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Full name must be 100 characters or less',
      });
    });

    it('should return 409 when email already exists', async () => {
      const existingUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Existing User',
        currency: 'USD',
        role: 'user',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'TestPass123!',
        full_name: 'Test User',
      };

      mockValidatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockGetUserByEmail.mockResolvedValue(existingUser);

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(409);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    it('should handle unique constraint violation', async () => {
      const error = new Error('Duplicate key');
      (error as any).code = '23505';

      mockRequest.body = {
        email: 'test@example.com',
        password: 'TestPass123!',
        full_name: 'Test User',
      };

      mockValidatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockGetUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashed');
      mockCreateUser.mockRejectedValue(error);

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(409);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    it('should use default currency USD when not provided', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        full_name: 'Test User',
      };

      const createdUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        currency: 'USD',
        role: 'user',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.body = userData;
      mockValidatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockGetUserByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashed');
      mockCreateUser.mockResolvedValue(createdUser);
      mockGenerateToken.mockReturnValue('token');

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'USD' })
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        currency: 'USD',
        role: 'user',
        password_hash: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const token = 'jwt-token';

      mockRequest.body = {
        email: 'test@example.com',
        password: 'TestPass123!',
      };

      mockGetUserByEmail.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateToken.mockReturnValue(token);

      await login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockComparePassword).toHaveBeenCalledWith('TestPass123!', 'hashed-password');
      expect(responseJson).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
        }),
        token,
      });
    });

    it('should return 400 for missing email', async () => {
      mockRequest.body = { password: 'TestPass123!' };

      await login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Email is required' });
    });

    it('should return 400 for missing password', async () => {
      mockRequest.body = { email: 'test@example.com' };

      await login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Password is required' });
    });

    it('should return 401 for non-existent user', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'TestPass123!',
      };

      mockGetUserByEmail.mockResolvedValue(null);

      await login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });

    it('should return 401 for incorrect password', async () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        currency: 'USD',
        role: 'user',
        password_hash: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      mockGetUserByEmail.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(false);

      await login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });
  });

  describe('logout', () => {
    it('should return success message', async () => {
      await logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseJson).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user profile', async () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        currency: 'USD',
        role: 'user',
        password_hash: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      mockGetUserById.mockResolvedValue(user);

      await getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetUserById).toHaveBeenCalledWith('user-123');
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
        })
      );
      expect(responseJson.mock.calls[0]![0]).not.toHaveProperty('password_hash');
    });

    it('should return 401 when user is not authenticated', async () => {
      delete mockRequest.user;

      await getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should return 404 when user not found', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      mockGetUserById.mockResolvedValue(null);

      await getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });
});

