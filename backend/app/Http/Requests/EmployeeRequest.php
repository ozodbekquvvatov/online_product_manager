<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $employeeId = $this->route('employee') ? $this->route('employee') : ($this->route('id') ? $this->route('id') : null);

        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'position' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'base_salary' => 'required|numeric|min:0',
            'hire_date' => 'nullable|date',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string',
            'employment_type' => 'required|in:full_time,part_time,contract,temporary',
            'work_hours_per_day' => 'required|integer|min:1|max:24',
            'work_shift' => 'required|in:day,night,both',
            'is_active' => 'sometimes|boolean'
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'First name field is required',
            'last_name.required' => 'Last name field is required',
            'position.required' => 'Position field is required',
            'department.required' => 'Department field is required',
            'base_salary.required' => 'Salary field is required',
            'base_salary.numeric' => 'Salary must be a number',
            'base_salary.min' => 'Salary must be greater than 0',
            'work_hours_per_day.required' => 'Work hours field is required',
            'work_hours_per_day.integer' => 'Work hours must be an integer',
            'work_hours_per_day.min' => 'Work hours must be greater than 1',
            'work_hours_per_day.max' => 'Work hours must be less than 24',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Convert empty strings to null for nullable fields
        $this->merge([
            'phone' => $this->phone ?: null,
            'hire_date' => $this->hire_date ?: null,
            'date_of_birth' => $this->date_of_birth ?: null,
            'address' => $this->address ?: null,
            'work_hours_per_day' => $this->work_hours_per_day ? (int)$this->work_hours_per_day : 8,
            'base_salary' => (float)$this->base_salary,
        ]);
    }
}