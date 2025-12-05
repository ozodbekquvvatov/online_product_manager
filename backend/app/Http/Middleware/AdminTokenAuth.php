<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminTokenAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        Log::info('🔐 AdminTokenAuth Middleware - Starting authentication check');
        
        $token = $request->bearerToken();
        
        Log::info('🔐 Bearer token received:', ['token_exists' => !empty($token), 'token_length' => $token ? strlen($token) : 0]);
        
        if (!$token) {
            Log::warning('🔐 No token provided');
            return response()->json([
                'success' => false,
                'message' => 'Access token required'
            ], 401);
        }

        // Check if admin_users table exists
        if (!\Illuminate\Support\Facades\Schema::hasTable('admin_users')) {
            Log::error('🔐 Admin users table does not exist');
            return response()->json([
                'success' => false,
                'message' => 'System configuration error'
            ], 500);
        }

        Log::info('🔐 Looking for user with token in admin_users table');
        
        // Find user by token in admin_users table
        $adminUser = DB::table('admin_users')
            ->where('api_token', $token)
            ->where('is_active', true)
            ->first();

        Log::info('🔐 User lookup result:', [
            'user_found' => !is_null($adminUser),
            'user_id' => $adminUser->id ?? null,
            'user_email' => $adminUser->email ?? null
        ]);

        if (!$adminUser) {
            Log::warning('🔐 Invalid or inactive user token');
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired token'
            ], 401);
        }

        Log::info('🔐 User authenticated successfully:', ['user_id' => $adminUser->id, 'email' => $adminUser->email]);

        // Convert stdClass to array before merging
        $adminUserArray = (array) $adminUser;
        
        // Add user to request for controller access
        $request->merge(['admin_user' => $adminUserArray]);
        
        // Also set it as an attribute (better approach)
        $request->attributes->set('admin_user', $adminUserArray);

        return $next($request);
    }
}