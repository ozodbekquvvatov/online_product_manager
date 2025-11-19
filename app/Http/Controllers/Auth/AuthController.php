<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\LoginRequest;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Admin login method - TOKEN BASED
     */
   public function login(LoginRequest $request)
{
    try {
        // Check if admin_users table exists
        if (!Schema::hasTable('admin_users')) {
            Log::error('Admin users table does not exist');
            return response()->json([
                'success' => false,
                'message' => 'System configuration error. Please run database migrations.'
            ], 500);
        }

        // Find admin user in database
        $adminUser = DB::table('admin_users')
            ->where('email', $request->email)
            ->where('is_active', true)
            ->first();

        if (!$adminUser) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials or account inactive'
            ], 401);
        }

        // Check password
        if (!Hash::check($request->password, $adminUser->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Generate API token
        $apiToken = Str::random(60);
        
        // Update user with new token
        DB::table('admin_users')
            ->where('id', $adminUser->id)
            ->update([
                'api_token' => $apiToken,
                'remember_token' => $request->remember_me ? Str::random(60) : null,
                'updated_at' => now()
            ]);

        // Get updated user data
        $updatedUser = DB::table('admin_users')
            ->where('id', $adminUser->id)
            ->first();

        $userData = [
            'id' => $updatedUser->id,
            'name' => $updatedUser->name,
            'email' => $updatedUser->email,
            'role' => $updatedUser->role,
            'full_name' => $updatedUser->name,
            'api_token' => $updatedUser->api_token,
        ];

        Log::info('Admin user logged in: ' . $updatedUser->email);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $userData,
            'token' => $apiToken
        ]);

    } catch (\Exception $e) {
        Log::error('Login error: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Login failed. Please try again later.'
        ], 500);
    }
}

    /**
     * Admin logout method - TOKEN BASED
     */
    public function logout(Request $request)
    {
        try {
            $token = $request->bearerToken();
            
            if ($token) {
                // Find user by token and clear it
                $adminUser = DB::table('admin_users')
                    ->where('api_token', $token)
                    ->first();

                if ($adminUser) {
                    DB::table('admin_users')
                        ->where('id', $adminUser->id)
                        ->update([
                            'api_token' => null,
                            'remember_token' => null,
                            'updated_at' => now()
                        ]);

                    Log::info('Admin user logged out: ' . $adminUser->email);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ]);

        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            
            return response()->json([
                'success' => true,
                'message' => 'Logout completed'
            ]);
        }
    }

    /**
     * Check authentication status - TOKEN BASED
     */
    public function checkAuth(Request $request)
    {
        try {
            $token = $request->bearerToken();
            
            if (!$token) {
                return response()->json([
                    'authenticated' => false,
                    'user' => null
                ]);
            }

            // Find user by token
            $adminUser = DB::table('admin_users')
                ->where('api_token', $token)
                ->where('is_active', true)
                ->first();

            if (!$adminUser) {
                return response()->json([
                    'authenticated' => false,
                    'user' => null
                ]);
            }

            $userData = [
                'id' => $adminUser->id,
                'name' => $adminUser->name,
                'email' => $adminUser->email,
                'role' => $adminUser->role,
                'full_name' => $adminUser->name,
            ];

            return response()->json([
                'authenticated' => true,
                'user' => $userData
            ]);

        } catch (\Exception $e) {
            Log::error('CheckAuth error: ' . $e->getMessage());
            
            return response()->json([
                'authenticated' => false,
                'user' => null
            ]);
        }
        
    }

    /**
     * Get admin profile - TOKEN BASED
     */
    public function getProfile(Request $request)
    {
        try {
            $token = $request->bearerToken();
            
            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not authenticated'
                ], 401);
            }

            // Get user by token
            $adminUser = DB::table('admin_users')
                ->where('api_token', $token)
                ->where('is_active', true)
                ->first();

            if (!$adminUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found or inactive'
                ], 404);
            }

            $profileData = [
                'id' => $adminUser->id,
                'name' => $adminUser->name,
                'email' => $adminUser->email,
                'role' => $adminUser->role,
                'full_name' => $adminUser->name,
                'is_active' => (bool)$adminUser->is_active,
                'created_at' => $adminUser->created_at,
                'updated_at' => $adminUser->updated_at,
            ];

            return response()->json([
                'success' => true,
                'data' => $profileData
            ]);

        } catch (\Exception $e) {
            Log::error('GetProfile error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get profile information'
            ], 500);
        }
    }

    /**
     * Update admin profile - TOKEN BASED
     */
    public function updateProfile(Request $request)
    {
        try {
            $token = $request->bearerToken();
            
            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not authenticated'
                ], 401);
            }

            // Get user by token
            $adminUser = DB::table('admin_users')
                ->where('api_token', $token)
                ->where('is_active', true)
                ->first();

            if (!$adminUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found or inactive'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:admin_users,email,' . $adminUser->id,
                'current_password' => 'sometimes|required|string',
                'new_password' => 'sometimes|required|string|min:6|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [];

            // Update name if provided
            if ($request->has('name')) {
                $updateData['name'] = $request->name;
            }

            // Update email if provided
            if ($request->has('email')) {
                $updateData['email'] = $request->email;
            }

            // Update password if provided
            if ($request->has('current_password') && $request->has('new_password')) {
                if (!Hash::check($request->current_password, $adminUser->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Current password is incorrect'
                    ], 422);
                }

                $updateData['password'] = Hash::make($request->new_password);
            }

            if (!empty($updateData)) {
                $updateData['updated_at'] = now();
                
                DB::table('admin_users')
                    ->where('id', $adminUser->id)
                    ->update($updateData);

                Log::info('Admin profile updated: ' . $adminUser->email);
            }

            // Get updated user data
            $updatedUser = DB::table('admin_users')
                ->where('id', $adminUser->id)
                ->first();

            $userData = [
                'id' => $updatedUser->id,
                'name' => $updatedUser->name,
                'email' => $updatedUser->email,
                'role' => $updatedUser->role,
                'full_name' => $updatedUser->name,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $userData
            ]);

        } catch (\Exception $e) {
            Log::error('UpdateProfile error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile'
            ], 500);
        }
    }

    public function changePassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'current_password' => 'required',
                'new_password' => 'required|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Use bearer token to identify admin user (token-based auth throughout this controller)
            $token = $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not authenticated'
                ], 401);
            }

            $adminUser = DB::table('admin_users')
                ->where('api_token', $token)
                ->where('is_active', true)
                ->first();

            if (!$adminUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found or inactive'
                ], 404);
            }

            // Check current password
            if (!Hash::check($request->current_password, $adminUser->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 422);
            }

            // Update password using query builder (admin_users is not an Eloquent model here)
            DB::table('admin_users')
                ->where('id', $adminUser->id)
                ->update([
                    'password' => Hash::make($request->new_password),
                    'updated_at' => now()
                ]);

            Log::info('Admin password changed: ' . $adminUser->email);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('ChangePassword error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to change password'
            ], 500);
        }
    }

}