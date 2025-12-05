<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminUserSeeder extends Seeder
{
    public function run()
    {
        // Check if admin_users table exists
        if (!Schema::hasTable('admin_users')) {
            $this->command->warn('⚠️  admin_users table does not exist. Skipping admin user creation.');
            return;
        }

        $adminEmail = 'admin@business.com';
        $adminPassword = 'admin123';

        // Check if admin user exists
        $adminExists = DB::table('admin_users')
            ->where('email', $adminEmail)
            ->exists();

        if ($adminExists) {
            // Update existing admin
            DB::table('admin_users')
                ->where('email', $adminEmail)
                ->update([
                    'name' => 'Administrator',
                    'password' => Hash::make($adminPassword),
                    'role' => 'admin',
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
            $this->command->info('✅ Admin user updated successfully!');
        } else {
            // Create new admin
            DB::table('admin_users')->insert([
                'name' => 'Administrator',
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
                'role' => 'admin',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->command->info('✅ Admin user created successfully!');
        }
        
        $this->command->info('📧 Email: ' . $adminEmail);
        $this->command->info('🔑 Password: ' . $adminPassword);
    }
}