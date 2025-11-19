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
    public function index(): JsonResponse
    {
        try {
            $employees = Employees::orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $employees,
                'message' => 'Xodimlar muvaffaqiyatli olindi'
            ]);
        } catch (\Exception $e) {
            Log::error('Employees index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Xodimlarni olishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(EmployeeRequest $request): JsonResponse
    {
        try {
            Log::info('Employee store request data:', $request->all());
            
            $employeeData = $request->validated();
            Log::info('Validated employee data:', $employeeData);
            
            // Set default values
            $employeeData['is_active'] = $employeeData['is_active'] ?? true;
            $employeeData['employment_type'] = $employeeData['employment_type'] ?? 'full_time';
            $employeeData['work_hours_per_day'] = $employeeData['work_hours_per_day'] ?? 8;
            $employeeData['work_shift'] = $employeeData['work_shift'] ?? 'day';

            Log::info('Final employee data before creation:', $employeeData);

            $employee = Employees::create($employeeData);

            Log::info('Employee created successfully:', ['id' => $employee->id]);

            return response()->json([
                'success' => true,
                'data' => $employee,
                'message' => 'Xodim muvaffaqiyatli yaratildi'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Employee store error: ' . $e->getMessage());
            Log::error('Employee store trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Xodim yaratishda xatolik',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $employee = Employees::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Xodim topilmadi'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $employee,
                'message' => 'Xodim muvaffaqiyatli olindi'
            ]);
        } catch (\Exception $e) {
            Log::error('Employee show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Xodimni olishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(EmployeeRequest $request, string $id): JsonResponse
    {
        try {
            Log::info('Employee update request data:', $request->all());
            
            $employee = Employees::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Xodim topilmadi'
                ], 404);
            }

            $validatedData = $request->validated();
            Log::info('Validated update data:', $validatedData);

            // Handle is_active conversion
            if (isset($validatedData['is_active'])) {
                $validatedData['is_active'] = filter_var($validatedData['is_active'], FILTER_VALIDATE_BOOLEAN);
            }

            $employee->update($validatedData);

            Log::info('Employee updated successfully:', ['id' => $employee->id]);

            return response()->json([
                'success' => true,
                'data' => $employee,
                'message' => 'Xodim muvaffaqiyatli yangilandi'
            ]);
        } catch (\Exception $e) {
            Log::error('Employee update error: ' . $e->getMessage());
            Log::error('Employee update trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Xodimni yangilashda xatolik',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $employee = Employees::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Xodim topilmadi'
                ], 404);
            }

            $employee->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xodim muvaffaqiyatli o\'chirildi'
            ]);
        } catch (\Exception $e) {
            Log::error('Employee destroy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Xodimni o\'chirishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}