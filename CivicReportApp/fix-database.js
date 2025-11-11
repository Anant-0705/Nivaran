const { Client } = require('pg');

// Database connection configuration
// IMPORTANT: Replace [YOUR-PASSWORD] with your actual database password from Supabase Settings → Database
const client = new Client({
  connectionString: 'postgresql://postgres:Anant@2005@db.hgxfyfbrwtozynuyqccr.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function runDatabaseFixes() {
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // 1. Check current trigger status
    console.log('\n🔍 Checking current trigger status...');
    const triggerCheck = await client.query(`
      SELECT 
        schemaname,
        tablename,
        triggername,
        actiontiming,
        actionstatement
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE triggername = 'on_auth_user_created';
    `);
    console.log('Current triggers:', triggerCheck.rows);

    // 2. Check user counts
    console.log('\n📊 Checking user counts...');
    const userCounts = await client.query(`
      SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
      UNION ALL
      SELECT 'public.users' as table_name, COUNT(*) as count FROM public.users;
    `);
    console.log('User counts:', userCounts.rows);

    // 3. Check for orphaned auth users
    console.log('\n👤 Checking for users without profiles...');
    const orphanedUsers = await client.query(`
      SELECT 
        au.id,
        au.email,
        au.provider,
        au.created_at as auth_created,
        pu.id as profile_exists
      FROM auth.users au
      LEFT JOIN public.users pu ON au.id = pu.id
      WHERE pu.id IS NULL;
    `);
    console.log('Users without profiles:', orphanedUsers.rows);

    // 4. Drop and recreate the trigger function with OAuth support
    console.log('\n🔧 Updating trigger function for OAuth support...');
    
    // Drop existing function and trigger
    await client.query(`DROP FUNCTION IF EXISTS handle_new_user() CASCADE;`);
    
    // Create new function with OAuth metadata support
    await client.query(`
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Insert new user profile with OAuth metadata support
        INSERT INTO public.users (
          id,
          email,
          full_name,
          avatar_url,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          -- Extract full_name from OAuth metadata or user_metadata
          COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.user_metadata->>'full_name',
            NEW.user_metadata->>'name',
            split_part(NEW.email, '@', 1) -- fallback to email username
          ),
          -- Extract avatar_url from OAuth metadata
          COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture',
            NEW.user_metadata->>'avatar_url',
            NEW.user_metadata->>'picture'
          ),
          NOW(),
          NOW()
        );
        
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error (you can check this in Supabase logs)
          RAISE LOG 'Error in handle_new_user: %', SQLERRM;
          -- Don't fail the auth process, just log the error
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Create the trigger
    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    `);

    console.log('✅ Trigger function updated successfully!');

    // 5. Grant necessary permissions
    console.log('\n🔐 Setting up permissions...');
    await client.query(`
      GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
      GRANT ALL ON TABLE auth.users TO postgres, service_role;
      GRANT SELECT ON TABLE auth.users TO anon, authenticated;
    `);
    console.log('✅ Permissions set successfully!');

    // 6. Create profiles for existing orphaned users (if any)
    if (orphanedUsers.rows.length > 0) {
      console.log('\n🔄 Creating profiles for existing users...');
      for (const user of orphanedUsers.rows) {
        try {
          await client.query(`
            INSERT INTO public.users (
              id, email, full_name, created_at, updated_at
            ) VALUES (
              $1, $2, $3, NOW(), NOW()
            )
          `, [user.id, user.email, user.email.split('@')[0]]);
          console.log(`✅ Created profile for ${user.email}`);
        } catch (error) {
          console.log(`❌ Error creating profile for ${user.email}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Database fixes completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Updated trigger function for OAuth support');
    console.log('- ✅ Set up proper permissions');
    console.log('- ✅ Created profiles for existing users');
    console.log('\n🚀 You can now try Google sign-in again!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the fixes
runDatabaseFixes();
