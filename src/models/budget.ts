import { query } from '../config/database.js';

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: string; // DECIMAL is returned as string from PostgreSQL
  month: string; // DATE is returned as string from PostgreSQL (YYYY-MM-DD)
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateBudgetInput {
  user_id: string;
  category_id: string;
  amount: number;
  month: string; // ISO date string (YYYY-MM-DD) - should be first day of month
}

export interface UpdateBudgetInput {
  category_id?: string;
  amount?: number;
  month?: string; // ISO date string (YYYY-MM-DD) - should be first day of month
}

// Get all budgets (optionally filtered by user_id, category_id, month)
export const getAllBudgets = async (
  user_id?: string,
  category_id?: string,
  month?: string
): Promise<Budget[]> => {
  let sql = 'SELECT * FROM budgets WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  if (user_id) {
    sql += ` AND user_id = $${paramCount}`;
    params.push(user_id);
    paramCount++;
  }

  if (category_id) {
    sql += ` AND category_id = $${paramCount}`;
    params.push(category_id);
    paramCount++;
  }

  if (month) {
    sql += ` AND month = $${paramCount}`;
    params.push(month);
    paramCount++;
  }

  sql += ' ORDER BY month DESC, created_at DESC';

  const result = await query(sql, params);
  return result.rows;
};

// Get budget by ID
export const getBudgetById = async (id: string): Promise<Budget | null> => {
  const result = await query('SELECT * FROM budgets WHERE id = $1', [id]);
  return result.rows[0] || null;
};

// Get budgets by user_id
export const getBudgetsByUserId = async (
  user_id: string
): Promise<Budget[]> => {
  const result = await query(
    `SELECT * FROM budgets 
     WHERE user_id = $1 
     ORDER BY month DESC, created_at DESC`,
    [user_id]
  );
  return result.rows;
};

// Get budgets by user_id and month
export const getBudgetsByUserIdAndMonth = async (
  user_id: string,
  month: string
): Promise<Budget[]> => {
  const result = await query(
    `SELECT * FROM budgets 
     WHERE user_id = $1 AND month = $2 
     ORDER BY created_at DESC`,
    [user_id, month]
  );
  return result.rows;
};

// Create a new budget
export const createBudget = async (
  input: CreateBudgetInput
): Promise<Budget> => {
  const result = await query(
    `INSERT INTO budgets (user_id, category_id, amount, month) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [input.user_id, input.category_id, input.amount, input.month]
  );
  return result.rows[0];
};

// Update a budget
export const updateBudget = async (
  id: string,
  input: UpdateBudgetInput
): Promise<Budget | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.category_id !== undefined) {
    updates.push(`category_id = $${paramCount++}`);
    values.push(input.category_id);
  }
  if (input.amount !== undefined) {
    updates.push(`amount = $${paramCount++}`);
    values.push(input.amount);
  }
  if (input.month !== undefined) {
    updates.push(`month = $${paramCount++}`);
    values.push(input.month);
  }

  if (updates.length === 0) {
    return getBudgetById(id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await query(
    `UPDATE budgets 
     SET ${updates.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

// Delete a budget
export const deleteBudget = async (id: string): Promise<boolean> => {
  const result = await query('DELETE FROM budgets WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

