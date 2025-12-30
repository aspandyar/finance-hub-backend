import { query } from '../config/database.js';

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  color: string;
  icon: string | null;
  is_system: boolean;
  created_at?: Date;
}

export interface CreateCategoryInput {
  user_id?: string | null;
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string | null;
  is_system?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: CategoryType;
  color?: string;
  icon?: string | null;
}

// Get all categories (optionally filtered by user_id and type)
export const getAllCategories = async (
  user_id?: string | null,
  type?: CategoryType
): Promise<Category[]> => {
  let sql = 'SELECT * FROM categories WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  if (user_id !== undefined) {
    if (user_id === null) {
      // Get only system categories
      sql += ' AND user_id IS NULL';
    } else {
      // Get user categories and system categories
      sql += ` AND (user_id = $${paramCount} OR user_id IS NULL)`;
      params.push(user_id);
      paramCount++;
    }
  }

  if (type !== undefined) {
    sql += ` AND type = $${paramCount}`;
    params.push(type);
    paramCount++;
  }

  sql += ' ORDER BY is_system DESC, name ASC';

  const result = await query(sql, params);
  return result.rows;
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0] || null;
};

// Get categories by user_id
export const getCategoriesByUserId = async (
  user_id: string
): Promise<Category[]> => {
  const result = await query(
    `SELECT * FROM categories 
     WHERE user_id = $1 OR user_id IS NULL 
     ORDER BY is_system DESC, name ASC`,
    [user_id]
  );
  return result.rows;
};

// Create a new category
export const createCategory = async (
  input: CreateCategoryInput
): Promise<Category> => {
  const result = await query(
    `INSERT INTO categories (user_id, name, type, color, icon, is_system) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [
      input.user_id || null,
      input.name,
      input.type,
      input.color || '#6B7280',
      input.icon || null,
      input.is_system || false,
    ]
  );
  return result.rows[0];
};

// Update a category
export const updateCategory = async (
  id: string,
  input: UpdateCategoryInput
): Promise<Category | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(input.name);
  }
  if (input.type !== undefined) {
    updates.push(`type = $${paramCount++}`);
    values.push(input.type);
  }
  if (input.color !== undefined) {
    updates.push(`color = $${paramCount++}`);
    values.push(input.color);
  }
  if (input.icon !== undefined) {
    updates.push(`icon = $${paramCount++}`);
    values.push(input.icon);
  }

  if (updates.length === 0) {
    return getCategoryById(id);
  }

  values.push(id);
  const result = await query(
    `UPDATE categories 
     SET ${updates.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

// Delete a category
export const deleteCategory = async (id: string): Promise<boolean> => {
  // Prevent deletion of system categories
  const category = await getCategoryById(id);
  if (category && category.is_system) {
    throw new Error('Cannot delete system categories');
  }

  const result = await query('DELETE FROM categories WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

