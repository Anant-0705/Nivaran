-- SQL functions to support the migration system

-- Function to create migrations table
CREATE OR REPLACE FUNCTION create_migrations_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to execute migrations safely
CREATE OR REPLACE FUNCTION execute_migration(migration_sql TEXT, migration_name VARCHAR(255))
RETURNS VOID AS $$
DECLARE
  sql_statement TEXT;
BEGIN
  -- Validate that migration hasn't been executed
  IF EXISTS (SELECT 1 FROM migrations WHERE filename = migration_name) THEN
    RAISE EXCEPTION 'Migration % has already been executed', migration_name;
  END IF;

  -- Execute the migration SQL
  EXECUTE migration_sql;
  
  -- Log the successful execution
  RAISE NOTICE 'Migration % executed successfully', migration_name;
END;
$$ LANGUAGE plpgsql;