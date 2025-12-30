-- Create category type enum
CREATE TYPE category_type AS ENUM ('income', 'expense');

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  type category_type NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_category UNIQUE (user_id, name, type)
);

-- Create index on user_id and type for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);

-- Insert system default categories
-- Income categories
INSERT INTO categories (name, type, color, icon, is_system, user_id) VALUES
  ('Salary', 'income', '#10B981', 'briefcase', TRUE, NULL),
  ('Freelance', 'income', '#3B82F6', 'code', TRUE, NULL),
  ('Investments', 'income', '#8B5CF6', 'trending-up', TRUE, NULL),
  ('Gifts', 'income', '#EC4899', 'gift', TRUE, NULL),
  ('Other Income', 'income', '#6B7280', 'dollar-sign', TRUE, NULL)
ON CONFLICT (user_id, name, type) DO NOTHING;

-- Expense categories
INSERT INTO categories (name, type, color, icon, is_system, user_id) VALUES
  ('Food', 'expense', '#F59E0B', 'utensils', TRUE, NULL),
  ('Transport', 'expense', '#EF4444', 'car', TRUE, NULL),
  ('Housing', 'expense', '#6366F1', 'home', TRUE, NULL),
  ('Utilities', 'expense', '#14B8A6', 'zap', TRUE, NULL),
  ('Entertainment', 'expense', '#A855F7', 'film', TRUE, NULL),
  ('Shopping', 'expense', '#F97316', 'shopping-bag', TRUE, NULL),
  ('Health', 'expense', '#EC4899', 'heart', TRUE, NULL),
  ('Education', 'expense', '#06B6D4', 'book', TRUE, NULL),
  ('Other Expense', 'expense', '#6B7280', 'more-horizontal', TRUE, NULL)
ON CONFLICT (user_id, name, type) DO NOTHING;

