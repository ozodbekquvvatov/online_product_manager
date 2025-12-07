<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AutoEmployeesSeeder extends Seeder
{
    public function run(): void
    {
        $employees = [];

        for ($i = 1; $i <= 10; $i++) {
            $firstName = $this->generateFirstName();
            $lastName = $this->generateLastName();
            $email = strtolower($firstName . '.' . $lastName . '@company.com');

            $employees[] = [
                'employee_id' => 'EMP2023' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'first_name' => $firstName,
                'last_name' => $lastName,
                'phone' => $this->generatePhone(),
                'position' => $this->generatePosition(),
                'department' => $this->generateDepartment(),
                'base_salary' => $this->generateSalary(), // Changed from salary to base_salary
                'hire_date' => $this->generateHireDate(),
                'date_of_birth' => $this->generateBirthDate(),
                'address' => $this->generateAddress(),
                'employment_type' => $this->generateEmploymentType(),
                'work_hours_per_day' => $this->generateWorkHours(), // New field
                'work_shift' => $this->generateWorkShift(), // New field
                'is_active' => $this->generateIsActive(), // New field (replaces status)
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];
        }

        DB::table('employees')->insert($employees);
        $this->command->info('✅ 10 employees created successfully!');
    }

    private function generateFirstName(): string
    {
        $firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'William', 'Jessica'];
        return $firstNames[array_rand($firstNames)];
    }

    private function generateLastName(): string
    {
        $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
        return $lastNames[array_rand($lastNames)];
    }

    private function generatePhone(): string
    {
        return '+1-' . rand(200, 999) . '-' . rand(200, 999) . '-' . rand(1000, 9999);
    }

    private function generatePosition(): string
    {
        $positions = ['Sales Manager', 'Sales Representative', 'Inventory Specialist', 'Customer Service', 'Warehouse Manager', 'Accountant', 'IT Support', 'Marketing Specialist', 'HR Manager'];
        return $positions[array_rand($positions)];
    }

    private function generateDepartment(): string
    {
        $departments = ['Sales', 'Inventory', 'Support', 'Operations', 'Finance', 'IT', 'Marketing', 'HR'];
        return $departments[array_rand($departments)];
    }

    private function generateSalary(): float
    {
        return round(rand(35000, 80000) + (rand(0, 99) / 100), 2);
    }

    private function generateHireDate(): string
    {
        return now()->subDays(rand(30, 730))->format('Y-m-d');
    }

    private function generateBirthDate(): string
    {
        return now()->subYears(rand(25, 55))->subDays(rand(0, 365))->format('Y-m-d');
    }

    private function generateAddress(): string
    {
        $streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln'];
        return rand(100, 9999) . ' ' . $streets[array_rand($streets)];
    }

    private function generateEmploymentType(): string
    {
        $types = ['full_time', 'part_time', 'contract', 'temporary'];
        return $types[array_rand($types)];
    }

    // New methods for the added fields
    private function generateWorkHours(): int
    {
        $hours = [4, 6, 8, 10, 12];
        return $hours[array_rand($hours)];
    }

    private function generateWorkShift(): string
    {
        $shifts = ['day', 'night', 'both'];
        return $shifts[array_rand($shifts)];
    }

    private function generateIsActive(): bool
    {
        // 80% chance of being active, 20% inactive
        return rand(1, 100) <= 80;
    }

    // Removed methods for deleted fields:
    // - generateCity()
    // - generateState() 
    // - generatePostalCode()
    // - generateStatus()
    // - generateEmergencyContactName()
    // - generateEmergencyContactPhone()
    // - generateNotes()
}