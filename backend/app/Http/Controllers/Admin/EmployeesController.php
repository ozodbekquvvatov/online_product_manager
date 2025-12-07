<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employees;
use App\Http\Requests\EmployeeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmployeesController extends Controller
{
    /**
     * Get all employees listing
     * Returns paginated list of employees sorted by creation date (newest first)
     * 
     * @return JsonResponse JSON response with employees data or error
     */
    public function index(): JsonResponse
    {
        try {
            // Fetch all employees ordered by creation date (most recent first)
            $employees = Employees::orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $employees,
                'message' => 'Employees retrieved successfully'
            ]);
        } catch (\Exception $e) {
            // Log error for debugging and monitoring
            Log::error('Employees index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving employees',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new employee
     * Validates input using EmployeeRequest, sets defaults, and creates employee record
     * 
     * @param EmployeeRequest $request Validated employee data
     * @return JsonResponse JSON response with created employee or error
     */
    public function store(EmployeeRequest $request): JsonResponse
    {
        try {
            // Log incoming request data for debugging and audit trail
            Log::info('Employee store request data:', $request->all());
            
            // Get validated data from EmployeeRequest
            $employeeData = $request->validated();
            Log::info('Validated employee data:', $employeeData);
            
            // --- SET DEFAULT VALUES FOR OPTIONAL FIELDS ---
            // Active status: default to true (active)
            $employeeData['is_active'] = $employeeData['is_active'] ?? true;
            
            // Employment type: default to full-time
            $employeeData['employment_type'] = $employeeData['employment_type'] ?? 'full_time';
            
            // Work hours: default to 8 hours per day
            $employeeData['work_hours_per_day'] = $employeeData['work_hours_per_day'] ?? 8;
            
            // Work shift: default to day shift
            $employeeData['work_shift'] = $employeeData['work_shift'] ?? 'day';

            Log::info('Final employee data before creation:', $employeeData);

            // Create new employee record
            $employee = Employees::create($employeeData);

            // Log successful creation with employee ID
            Log::info('Employee created successfully:', ['id' => $employee->id]);

            return response()->json([
                'success' => true,
                'data' => $employee,
                'message' => 'Employee created successfully'
            ], 201); // HTTP 201 Created status
        } catch (\Exception $e) {
            // Detailed error logging for troubleshooting
            Log::error('Employee store error: ' . $e->getMessage());
            Log::error('Employee store trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Error creating employee',
                'error' => $e->getMessage(),
                // Include stack trace only in debug mode for security
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Get specific employee details
     * Retrieves employee by ID with error handling for non-existent records
     * 
     * @param string $id Employee ID
     * @return JsonResponse JSON response with employee data or error
     */
    public function show(string $id): JsonResponse
    {
        try {
            // Find employee by primary key
            $employee = Employees::find($id);

            // Return 404 if employee not found
            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $employee,
                'message' => 'Employee retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Employee show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving employee',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update existing employee
     * Validates input, finds employee, updates fields, and saves changes
     * 
     * @param EmployeeRequest $request Validated update data
     * @param string $id Employee ID to update
     * @return JsonResponse JSON response with updated employee or error
     */
    public function update(EmployeeRequest $request, string $id): JsonResponse
    {
        try {
            // Log update request for audit trail
            Log::info('Employee update request data:', $request->all());
            
            // Find employee record
            $employee = Employees::find($id);

            // Return 404 if employee doesn't exist
            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            // Get validated data from request
            $validatedData = $request->validated();
            Log::info('Validated update data:', $validatedData);

            // --- SPECIAL HANDLING FOR BOOLEAN FIELD ---
            // Convert string 'true'/'false' to actual boolean for is_active
            if (isset($validatedData['is_active'])) {
                $validatedData['is_active'] = filter_var($validatedData['is_active'], FILTER_VALIDATE_BOOLEAN);
            }

            // Update employee with validated data
            $employee->update($validatedData);

            Log::info('Employee updated successfully:', ['id' => $employee->id]);

            return response()->json([
                'success' => true,
                'data' => $employee,
                'message' => 'Employee updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Employee update error: ' . $e->getMessage());
            Log::error('Employee update trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Error updating employee',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Delete an employee
     * Soft deletes employee record (if using SoftDeletes trait)
     * 
     * @param string $id Employee ID to delete
     * @return JsonResponse JSON response with success message or error
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            // Find employee to delete
            $employee = Employees::find($id);

            // Return 404 if employee not found
            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            // Perform deletion (soft delete if implemented)
            $employee->delete();

            return response()->json([
                'success' => true,
                'message' => 'Employee deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Employee destroy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting employee',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}