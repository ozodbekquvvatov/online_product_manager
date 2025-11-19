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
            'images.required' => 'Kamida bitta rasm yuklashingiz kerak',
            'images.array' => 'Rasmlar noto\'g\'ri formatda',
            'images.min' => 'Kamida bitta rasm yuklashingiz kerak',
            'images.max' => 'Bir vaqtning o\'zida 10 tadan ortiq rasm yuklab bo\'lmaydi',
            'images.*.image' => 'Faqat rasm fayllarini yuklashingiz mumkin',
            'images.*.mimes' => 'Faqat JPEG, PNG, JPG, GIF, WEBP formatidagi rasmlarni yuklashingiz mumkin',
            'images.*.max' => 'Har bir rasm hajmi 5MB dan oshmasligi kerak',
        ];
    }
}