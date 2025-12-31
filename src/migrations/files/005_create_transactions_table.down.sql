-- Drop indexes
DROP INDEX IF EXISTS idx_transactions_user_type;
DROP INDEX IF EXISTS idx_transactions_user_category;
DROP INDEX IF EXISTS idx_transactions_user_date;

-- Drop transactions table
DROP TABLE IF EXISTS transactions;

-- Drop transaction type enum
DROP TYPE IF EXISTS transaction_type;

