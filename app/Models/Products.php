<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Products extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'cost_price',
        'selling_price',
        'stock_quantity',
        'reorder_level',
        'unit_of_measure',
        'description',
        'is_active',
        'profit_margin',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'reorder_level' => 'integer',
        'is_active' => 'boolean',
        'profit_margin' => 'decimal:2',
    ];

    /**
     * Calculate profit margin automatically before saving
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($product) {
            if ($product->selling_price > 0) {
                $product->profit_margin = (($product->selling_price - $product->cost_price) / $product->selling_price) * 100;
            } else {
                $product->profit_margin = 0;
            }
        });
    }

    /**
     * Check if product is low stock
     */
    public function isLowStock(): bool
    {
        return $this->stock_quantity <= $this->reorder_level;
    }

    /**
     * Get products that are low in stock
     */
    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock_quantity', '<=', 'reorder_level')
                    ->where('is_active', true);
    }

    /**
     * Get active products
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get total inventory value
     */
    public function getInventoryValueAttribute(): float
    {
        return $this->stock_quantity * $this->cost_price;
    }

    /**
     * Get profit per unit
     */
    public function getProfitPerUnitAttribute(): float
    {
        return $this->selling_price - $this->cost_price;
    }

   public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'product_id')->orderBy('is_primary', 'desc')->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class, 'product_id')->where('is_primary', true);
    }

}