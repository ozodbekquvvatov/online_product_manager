<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('admin_users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('api_token', 80)->unique()->nullable()->default(null);
            $table->string('remember_token', 100)->nullable();
            $table->string('role')->default('admin');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default admin user
        DB::table('admin_users')->insert([
            'name' => 'Administrator',
            'email' => 'admin@business.com',
            'password' => Hash::make('admin123'),
            'api_token' => null,
            'role' => 'admin',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('admin_users');
    }
};