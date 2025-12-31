import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, decodeToken, type JWTPayload } from '../utils/jwt.js';
import config from '../config/config.js';

// Mock dependencies
jest.mock('../config/config.js', () => ({
  default: {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
  },
}));

jest.mock('jsonwebtoken');

describe('JWT Utils', () => {
  const mockJwt = jwt as jest.Mocked<typeof jwt>;
  const mockPayload: JWTPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a JWT token with correct payload', () => {
      const expectedToken = 'generated-token';
      mockJwt.sign.mockReturnValue(expectedToken as any);

      const result = generateToken(mockPayload);

      expect(result).toBe(expectedToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should throw error when JWT_SECRET is not configured', () => {
      const originalSecret = config.jwtSecret;
      (config as any).jwtSecret = undefined;

      expect(() => generateToken(mockPayload)).toThrow('JWT_SECRET is not configured');

      (config as any).jwtSecret = originalSecret;
    });
  });

  describe('verifyToken', () => {
    it('should verify and return decoded token', () => {
      const token = 'valid-token';
      mockJwt.verify.mockReturnValue(mockPayload as any);

      const result = verifyToken(token);

      expect(result).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    });

    it('should throw error for invalid token', () => {
      const token = 'invalid-token';
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyToken(token)).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      const token = 'expired-token';
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => verifyToken(token)).toThrow('Invalid or expired token');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = 'some-token';
      mockJwt.decode.mockReturnValue(mockPayload as any);

      const result = decodeToken(token);

      expect(result).toEqual(mockPayload);
      expect(mockJwt.decode).toHaveBeenCalledWith(token);
    });

    it('should return null when decode fails', () => {
      const token = 'invalid-token';
      mockJwt.decode.mockReturnValue(null);

      const result = decodeToken(token);

      expect(result).toBeNull();
    });

    it('should return null when decode throws error', () => {
      const token = 'invalid-token';
      mockJwt.decode.mockImplementation(() => {
        throw new Error('Decode error');
      });

      const result = decodeToken(token);

      expect(result).toBeNull();
    });
  });
});

