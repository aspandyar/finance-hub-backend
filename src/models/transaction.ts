import { query } from '../config/database.js';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: string; // DECIMAL is returned as string from PostgreSQL
  type: TransactionType;
  description: string | null;
  date: string; // DATE is returned as string from PostgreSQL
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateTransactionInput {
  user_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  description?: string | null;
  date: string; // ISO date string (YYYY-MM-DD)
}

export interface UpdateTransactionInput {
  category_id?: string;
  amount?: number;
  type?: TransactionType;
  description?: string | null;
  date?: string; // ISO date string (YYYY-MM-DD)
}

// Get all transactions (optionally filtered by user_id, type, category_id, date range)
export const getAllTransactions = async (
  user_id?: string,
  type?: TransactionType,
  category_id?: string,
  start_date?: string,
  end_date?: string
): Promise<Transaction[]> => {
  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  if (user_id) {
    sql += ` AND user_id = $${paramCount}`;
    params.push(user_id);
    paramCount++;
  }

  if (type) {
    sql += ` AND type = $${paramCount}`;
    params.push(type);
    paramCount++;
  }

  if (category_id) {
    sql += ` AND category_id = $${paramCount}`;
    params.push(category_id);
    paramCount++;
  }

  if (start_date) {
    sql += ` AND date >= $${paramCount}`;
    params.push(start_date);
    paramCount++;
  }

  if (end_date) {
    sql += ` AND date <= $${paramCount}`;
    params.push(end_date);
    paramCount++;
  }

  sql += ' ORDER BY date DESC, created_at DESC';

  const result = await query(sql, params);
  return result.rows;
};

// Get transaction by ID
export const getTransactionById = async (
  id: string
): Promise<Transaction | null> => {
  const result = await query('SELECT * FROM transactions WHERE id = $1', [id]);
  return result.rows[0] || null;
};

// Get transactions by user_id
export const getTransactionsByUserId = async (
  user_id: string
): Promise<Transaction[]> => {
  const result = await query(
    `SELECT * FROM transactions 
     WHERE user_id = $1 
     ORDER BY date DESC, created_at DESC`,
    [user_id]
  );
  return result.rows;
};

// Create a new transaction
export const createTransaction = async (
  input: CreateTransactionInput
): Promise<Transaction> => {
  const result = await query(
    `INSERT INTO transactions (user_id, category_id, amount, type, description, date) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [
      input.user_id,
      input.category_id,
      input.amount,
      input.type,
      input.description || null,
      input.date,
    ]
  );
  return result.rows[0];
};

// Update a transaction
export const updateTransaction = async (
  id: string,
  input: UpdateTransactionInput
): Promise<Transaction | null> => {
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
  if (input.type !== undefined) {
    updates.push(`type = $${paramCount++}`);
    values.push(input.type);
  }
  if (input.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(input.description);
  }
  if (input.date !== undefined) {
    updates.push(`date = $${paramCount++}`);
    values.push(input.date);
  }

  if (updates.length === 0) {
    return getTransactionById(id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await query(
    `UPDATE transactions 
     SET ${updates.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<boolean> => {
  const result = await query('DELETE FROM transactions WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

