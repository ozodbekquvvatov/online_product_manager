<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sales extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sale_number',
        'sale_date',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'status',
        'payment_status',
        'payment_method',
        'notes',
        'user_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'sale_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    /**
     * Boot function to generate sale number
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($sale) {
            if (empty($sale->sale_number)) {
                $sale->sale_number = static::generateSaleNumber();
            }
        });
    }

    /**
     * Generate unique sale number
     */
    public static function generateSaleNumber(): string
    {
        $prefix = 'SALE';
        $date = now()->format('Ymd');
        $lastSale = static::where('sale_number', 'like', "{$prefix}{$date}%")->latest()->first();

        if ($lastSale) {
            $lastNumber = (int) substr($lastSale->sale_number, -4);
            $number = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $number = '0001';
        }

        return "{$prefix}{$date}{$number}";
    }

    /**
     * Get the user (employee) who made the sale
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
  public function sale()
    {
        return $this->belongsTo(Sales::class);
    }

    public function product()
    {
        return $this->belongsTo(Products::class);
    }
    /**
     * Get the sale items for the sale
     */
      public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class, 'sale_id'); // Explicitly specify foreign key
    }
    /**
     * Scope a query to only include completed sales.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope a query to only include pending sales.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include paid sales.
     */
    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    /**
     * Calculate total sales for a period
     */
    public static function getTotalSales($startDate = null, $endDate = null)
    {
        $query = static::completed()->paid();

        if ($startDate) {
            $query->where('sale_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('sale_date', '<=', $endDate);
        }

        return $query->sum('total_amount');
    }

    /**
     * Get sales trend data for charts
     */
    public static function getSalesTrend($period = 'monthly')
    {
        $query = static::completed()->paid();

        if ($period === 'monthly') {
            return $query->selectRaw('
                DATE_FORMAT(sale_date, "%Y-%m") as period,
                SUM(total_amount) as total_sales,
                COUNT(*) as transaction_count
            ')
            ->groupBy('period')
            ->orderBy('period')
            ->get();
        }

        // Add more period types as needed (daily, weekly, yearly)
        return $query->get();
    }
}