<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'cost_price' => 'sometimes|required|numeric|min:0',
            'selling_price' => 'sometimes|required|numeric|min:0|gt:cost_price',
            'stock_quantity' => 'sometimes|required|integer|min:0',
            'reorder_level' => 'sometimes|required|integer|min:0',
            'unit_of_measure' => 'sometimes|required|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Mahsulot nomi majburiy',
            'name.string' => 'Mahsulot nomi matn ko\'rinishida bo\'lishi kerak',
            'name.max' => 'Mahsulot nomi 255 belgidan oshmasligi kerak',
            'cost_price.required' => 'Narx majburiy',
            'cost_price.numeric' => 'Narx raqam bo\'lishi kerak',
            'cost_price.min' => 'Narx 0 dan katta bo\'lishi kerak',
            'selling_price.required' => 'Sotish narxi majburiy',
            'selling_price.numeric' => 'Sotish narxi raqam bo\'lishi kerak',
            'selling_price.min' => 'Sotish narxi 0 dan katta bo\'lishi kerak',
            'selling_price.gt' => 'Sotish narxi tannarxdan katta bo\'lishi kerak',
            'stock_quantity.required' => 'Qoldiq soni majburiy',
            'stock_quantity.integer' => 'Qoldiq soni butun son bo\'lishi kerak',
            'stock_quantity.min' => 'Qoldiq soni 0 dan katta yoki teng bo\'lishi kerak',
            'reorder_level.required' => 'Qayta buyurtma darajasi majburiy',
            'reorder_level.integer' => 'Qayta buyurtma darajasi butun son bo\'lishi kerak',
            'reorder_level.min' => 'Qayta buyurtma darajasi 0 dan katta yoki teng bo\'lishi kerak',
            'unit_of_measure.required' => 'Oʻlchov birligi majburiy',
            'unit_of_measure.string' => 'Oʻlchov birligi matn koʻrinishida boʻlishi kerak',
            'unit_of_measure.max' => 'Oʻlchov birligi 50 belgidan oshmasligi kerak',
            'description.string' => 'Tavsif matn koʻrinishida boʻlishi kerak',
            'is_active.boolean' => 'Faol holat notoʻgʻri formatda',
        ];
    }
}