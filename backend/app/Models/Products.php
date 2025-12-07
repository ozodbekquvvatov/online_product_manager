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
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'cost_price_usd',
        'selling_price_usd',
        'profit_margin_percentage',
        'inventory_value_usd',
        'profit_per_unit_usd',
    ];

    // Exchange rate: 1 USD = 12,500 UZS
    private const USD_TO_UZS_RATE = 12500;

    /**
     * Get cost price in USD
     */
    public function getCostPriceUsdAttribute(): float
    {
        return round($this->cost_price / self::USD_TO_UZS_RATE, 2);
    }

    /**
     * Get selling price in USD
     */
    public function getSellingPriceUsdAttribute(): float
    {
        return round($this->selling_price / self::USD_TO_UZS_RATE, 2);
    }

    /**
     * Get profit margin as percentage
     */
    public function getProfitMarginPercentageAttribute(): float
    {
        return round($this->profit_margin, 2);
    }

    /**
     * Get total inventory value in USD
     */
    public function getInventoryValueUsdAttribute(): float
    {
        $valueUzs = $this->stock_quantity * $this->cost_price;
        return round($valueUzs / self::USD_TO_UZS_RATE, 2);
    }

    /**
     * Get profit per unit in USD
     */
    public function getProfitPerUnitUsdAttribute(): float
    {
        $profitUzs = $this->selling_price - $this->cost_price;
        return round($profitUzs / self::USD_TO_UZS_RATE, 2);
    }

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

        // Mutators for setting prices
        static::creating(function ($product) {
            if (isset($product->cost_price) && $product->cost_price < 1000) {
                // Assume value is in USD, convert to UZS for storage
                $product->cost_price = $product->cost_price * self::USD_TO_UZS_RATE;
            }
            if (isset($product->selling_price) && $product->selling_price < 1000) {
                // Assume value is in USD, convert to UZS for storage
                $product->selling_price = $product->selling_price * self::USD_TO_UZS_RATE;
            }
        });

        static::updating(function ($product) {
            if (isset($product->cost_price) && $product->cost_price < 1000) {
                // Assume value is in USD, convert to UZS for storage
                $product->cost_price = $product->cost_price * self::USD_TO_UZS_RATE;
            }
            if (isset($product->selling_price) && $product->selling_price < 1000) {
                // Assume value is in USD, convert to UZS for storage
                $product->selling_price = $product->selling_price * self::USD_TO_UZS_RATE;
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
     * Get total inventory value in UZS (original)
     */
    public function getInventoryValueAttribute(): float
    {
        return $this->stock_quantity * $this->cost_price;
    }

    /**
     * Get profit per unit in UZS (original)
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