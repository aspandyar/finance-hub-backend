import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Handles Prisma foreign key constraint violations (P2003)
 * and PostgreSQL foreign key constraint violations (23503)
 * 
 * @param error - The error object from Prisma or PostgreSQL
 * @param res - Express Response object (optional, if not provided, returns error object)
 * @returns Returns true if error was handled, false otherwise. If res is provided, sends response and returns true.
 */
export const handleForeignKeyError = (
  error: any,
  res?: Response
): boolean => {
  // Handle Prisma foreign key constraint violations
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2003: Foreign key constraint failed
    if (error.code === 'P2003') {
      const fieldName = error.meta?.field_name as string | undefined;
      const errorMessage = error.message?.toLowerCase() || '';
      
      // Check field name or error message to determine which field failed
      if (fieldName?.includes('category') || errorMessage.includes('category')) {
        const errorResponse = {
          error: 'Invalid category_id',
          message: 'The specified category does not exist',
        };
        
        if (res) {
          res.status(400).json(errorResponse);
          return true;
        }
        // If no res provided, throw a new error with the response
        throw new Error(JSON.stringify(errorResponse));
      }
      
      if (fieldName?.includes('user') || errorMessage.includes('user')) {
        const errorResponse = {
          error: 'Invalid user_id',
          message: 'The specified user does not exist',
        };
        
        if (res) {
          res.status(400).json(errorResponse);
          return true;
        }
        throw new Error(JSON.stringify(errorResponse));
      }
      
      // Fallback if field name is not clear
      const errorResponse = {
        error: 'Invalid foreign key reference',
        message: 'The specified user_id or category_id does not exist',
      };
      
      if (res) {
        res.status(400).json(errorResponse);
        return true;
      }
      throw new Error(JSON.stringify(errorResponse));
    }
  }
  
  // Handle PostgreSQL error codes (for backward compatibility)
  if (error.code === '23503') {
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('category')) {
      const errorResponse = {
        error: 'Invalid category_id',
        message: 'The specified category does not exist',
      };
      
      if (res) {
        res.status(400).json(errorResponse);
        return true;
      }
      throw new Error(JSON.stringify(errorResponse));
    }
    
    if (errorMessage.includes('user')) {
      const errorResponse = {
        error: 'Invalid user_id',
        message: 'The specified user does not exist',
      };
      
      if (res) {
        res.status(400).json(errorResponse);
        return true;
      }
      throw new Error(JSON.stringify(errorResponse));
    }
    
    // Generic foreign key error
    const errorResponse = {
      error: 'Invalid foreign key reference',
      message: 'The specified user_id or category_id does not exist',
    };
    
    if (res) {
      res.status(400).json(errorResponse);
      return true;
    }
    throw new Error(JSON.stringify(errorResponse));
  }
  
  return false;
};

/**
 * Handles Prisma unique constraint violations (P2002)
 * and PostgreSQL unique constraint violations (23505)
 * 
 * @param error - The error object from Prisma or PostgreSQL
 * @param res - Express Response object (optional)
 * @param customMessage - Custom error message (optional)
 * @returns Returns true if error was handled, false otherwise
 */
export const handleUniqueConstraintError = (
  error: any,
  res?: Response,
  customMessage?: string
): boolean => {
  // Handle Prisma unique constraint violations
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (error.code === 'P2002') {
      const errorResponse = {
        error: 'Unique constraint violation',
        message: customMessage || 'A record with this value already exists',
      };
      
      if (res) {
        res.status(409).json(errorResponse);
        return true;
      }
      throw new Error(JSON.stringify(errorResponse));
    }
  }
  
  // Handle PostgreSQL unique constraint violations
  if (error.code === '23505') {
    const errorResponse = {
      error: 'Unique constraint violation',
      message: customMessage || 'A record with this value already exists',
    };
    
    if (res) {
      res.status(409).json(errorResponse);
      return true;
    }
    throw new Error(JSON.stringify(errorResponse));
  }
  
  return false;
};

/**
 * General Prisma error handler that tries to handle common Prisma errors
 * 
 * @param error - The error object from Prisma or PostgreSQL
 * @param res - Express Response object (optional)
 * @param next - Express NextFunction (optional)
 * @returns Returns true if error was handled, false otherwise
 */
export const handlePrismaError = (
  error: any,
  res?: Response,
  next?: () => void
): boolean => {
  // Try to handle foreign key errors first
  if (handleForeignKeyError(error, res)) {
    return true;
  }
  
  // Try to handle unique constraint errors
  if (handleUniqueConstraintError(error, res)) {
    return true;
  }
  
  // If res and next are provided, pass to next middleware
  if (next) {
    next();
    return true;
  }
  
  return false;
};

