<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'images' => 'required|array|min:1|max:10',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max per image
            'is_primary' => 'sometimes|integer|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'images.required' => 'At least one image must be uploaded',
            'images.array' => 'Images must be in array format',
            'images.min' => 'At least one image must be uploaded',
            'images.max' => 'You cannot upload more than 10 images at once',
            'images.*.image' => 'Only image files can be uploaded',
            'images.*.mimes' => 'Only JPEG, PNG, JPG, GIF, and WEBP image formats are allowed',
            'images.*.max' => 'Each image must not exceed 5MB in size',
        ];
    }
}