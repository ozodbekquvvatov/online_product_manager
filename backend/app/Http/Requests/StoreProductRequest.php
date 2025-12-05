<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0|gt:cost_price',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'unit_of_measure' => 'required|string|max:50',
            'description' => 'nullable|string',
            
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Product name is required',
            'name.string' => 'Product name must be a string',
            'name.max' => 'Product name must not exceed 255 characters',
            'cost_price.required' => 'Cost price is required',
            'cost_price.numeric' => 'Cost price must be a number',
            'cost_price.min' => 'Cost price must be greater than 0',
            'selling_price.required' => 'Selling price is required',
            'selling_price.numeric' => 'Selling price must be a number',
            'selling_price.min' => 'Selling price must be greater than 0',
            'selling_price.gt' => 'Selling price must be greater than cost price',
            'stock_quantity.required' => 'Stock quantity is required',
            'stock_quantity.integer' => 'Stock quantity must be an integer',
            'stock_quantity.min' => 'Stock quantity must be 0 or greater',
            'reorder_level.required' => 'Reorder level is required',
            'reorder_level.integer' => 'Reorder level must be an integer',
            'reorder_level.min' => 'Reorder level must be 0 or greater',
            'unit_of_measure.required' => 'Unit of measure is required',
            'unit_of_measure.string' => 'Unit of measure must be a string',
            'unit_of_measure.max' => 'Unit of measure must not exceed 50 characters',
            'description.string' => 'Description must be a string',
        ];
    }
}