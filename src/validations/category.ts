import type { Response } from 'express';
import type { CategoryType } from '../models/category.js';
import { isValidHexColor } from './common.js';

/**
 * Validate category type
 */
export const isValidCategoryType = (type: string): type is CategoryType => {
  return type === 'income' || type === 'expense';
};

/**
 * Validate category name
 */
export const validateCategoryName = (name: any, res?: Response): boolean => {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    if (res) {
      res.status(400).json({ error: 'Category name is required' });
    }
    return false;
  }
  if (name.trim().length > 50) {
    if (res) {
      res.status(400).json({ error: 'Category name must be 50 characters or less' });
    }
    return false;
  }
  return true;
};

/**
 * Validate category type
 */
export const validateCategoryType = (type: any, res?: Response): boolean => {
  if (!type || !isValidCategoryType(type)) {
    if (res) {
      res.status(400).json({ error: "Category type must be 'income' or 'expense'" });
    }
    return false;
  }
  return true;
};

/**
 * Validate category color
 */
export const validateCategoryColor = (color: any, res?: Response): boolean => {
  if (color !== undefined) {
    if (typeof color !== 'string' || !isValidHexColor(color)) {
      if (res) {
        res.status(400).json({
          error: 'Color must be a valid hex color (e.g., #FF5733)',
        });
      }
      return false;
    }
  }
  return true;
};

/**
 * Validate category icon
 */
export const validateCategoryIcon = (icon: any, res?: Response): boolean => {
  if (icon !== undefined && icon !== null) {
    if (typeof icon !== 'string') {
      if (res) {
        res.status(400).json({ error: 'Icon must be a string' });
      }
      return false;
    }
    if (icon.length > 50) {
      if (res) {
        res.status(400).json({ error: 'Icon must be 50 characters or less' });
      }
      return false;
    }
  }
  return true;
};

/**
 * Validate all category creation fields
 */
export const validateCreateCategory = (
  data: {
    name: any;
    type: any;
    color?: any;
    icon?: any;
  },
  res?: Response
): boolean => {
  if (!validateCategoryName(data.name, res)) return false;
  if (!validateCategoryType(data.type, res)) return false;
  if (!validateCategoryColor(data.color, res)) return false;
  if (!validateCategoryIcon(data.icon, res)) return false;
  return true;
};

/**
 * Validate category update fields (all optional)
 */
export const validateUpdateCategory = (
  data: {
    name?: any;
    type?: any;
    color?: any;
    icon?: any;
  },
  res?: Response
): boolean => {
  if (data.name !== undefined) {
    if (!validateCategoryName(data.name, res)) return false;
  }
  if (data.type !== undefined) {
    if (!validateCategoryType(data.type, res)) return false;
  }
  if (data.color !== undefined) {
    if (!validateCategoryColor(data.color, res)) return false;
  }
  if (data.icon !== undefined) {
    if (!validateCategoryIcon(data.icon, res)) return false;
  }
  return true;
};

