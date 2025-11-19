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
            'first_name.required' => 'Ism maydoni to\'ldirilishi shart',
            'last_name.required' => 'Familiya maydoni to\'ldirilishi shart',
            'position.required' => 'Lavozim maydoni to\'ldirilishi shart',
            'department.required' => 'Bo\'lim maydoni to\'ldirilishi shart',
            'base_salary.required' => 'Maosh maydoni to\'ldirilishi shart',
            'base_salary.numeric' => 'Maosh raqam bo\'lishi kerak',
            'base_salary.min' => 'Maosh 0 dan katta bo\'lishi kerak',
            'work_hours_per_day.required' => 'Ish soati maydoni to\'ldirilishi shart',
            'work_hours_per_day.integer' => 'Ish soati butun son bo\'lishi kerak',
            'work_hours_per_day.min' => 'Ish soati 1 dan katta bo\'lishi kerak',
            'work_hours_per_day.max' => 'Ish soati 24 dan kichik bo\'lishi kerak',
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