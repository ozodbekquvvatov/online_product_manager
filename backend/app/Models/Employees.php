<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employees extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
        protected $table = 'employees';
     protected $fillable = [
        'employee_id',
        'first_name',
        'last_name',
        'phone',
        'position',
        'department',
        'base_salary', // Changed from salary
        'hire_date',
        'date_of_birth',
        'address',
        'employment_type',
        'work_hours_per_day', // New
        'work_shift', // New
        'is_active', // New (replaces status)
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'work_hours_per_day' => 'integer',
        'is_active' => 'boolean',
        'hire_date' => 'date',
        'date_of_birth' => 'date'
    ];

    /**
     * Boot function to generate employee ID
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($employee) {
            if (empty($employee->employee_id)) {
                $employee->employee_id = static::generateEmployeeId();
            }
        });
    }

    /**
     * Generate unique employee ID
     */
    public static function generateEmployeeId(): string
    {
        $prefix = 'EMP';
        $year = now()->format('Y');
        $lastEmployee = static::where('employee_id', 'like', "{$prefix}{$year}%")->latest()->first();

        if ($lastEmployee) {
            $lastNumber = (int) substr($lastEmployee->employee_id, -4);
            $number = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $number = '0001';
        }

        return "{$prefix}{$year}{$number}";
    }

    /**
     * Get full name attribute
     */
    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    /**
     * Scope a query to only include active employees.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include employees in a specific department.
     */
    public function scopeDepartment($query, $department)
    {
        return $query->where('department', $department);
    }

    /**
     * Scope a query to only include employees with a specific position.
     */
    public function scopePosition($query, $position)
    {
        return $query->where('position', $position);
    }

    /**
     * Calculate years of service
     */
    public function getYearsOfServiceAttribute(): int
    {
        return $this->hire_date->diffInYears(now());
    }

    /**
     * Check if employee is on probation (first 3 months)
     */
    public function getIsOnProbationAttribute(): bool
    {
        return $this->hire_date->diffInMonths(now()) < 3;
    }
}