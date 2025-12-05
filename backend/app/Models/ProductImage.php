<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'image_path',
        'image_name',
        'file_size',
        'mime_type',
        'is_primary',
        'sort_order',
        'alt_text'
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'file_size' => 'integer',
        'sort_order' => 'integer'
    ];

    public function product(): BelongsTo
    {
        // Explicitly specify the foreign key since your model is named Products
        return $this->belongsTo(Products::class, 'product_id');
    }
    public function getImageUrlAttribute(): string
    {
        return asset('storage/' . $this->image_path);
    }

    public function getFileSizeFormattedAttribute(): string
    {
        if ($this->file_size >= 1048576) {
            return round($this->file_size / 1048576, 2) . ' MB';
        } elseif ($this->file_size >= 1024) {
            return round($this->file_size / 1024, 2) . ' KB';
        }
        
        return $this->file_size . ' bytes';
    }
}