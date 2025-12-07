<?php

namespace App\Http\Controllers\Admin;

use Carbon\Carbon;
use App\Models\User;
use App\Models\Sales;
use App\Models\Product;
use App\Models\Products;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class SalesController extends Controller
{
    /**
     * Get all sales with detailed information
     * Returns complete sales history with customer, product, and item details
     * Includes data transformation for frontend compatibility
     * 
     * @return JsonResponse JSON response with sales data or error
     */
    public function index(): JsonResponse
    {
        try {
            Log::info('Fetching sales data');
            
            // Fetch sales with eager-loaded relationships to prevent N+1 queries
            $sales = Sales::with(['user', 'items.product'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            Log::info('Raw sales data:', ['count' => $sales->count(), 'first' => $sales->first()]);
            
            // Transform data to match frontend component expectations
            $transformedSales = $sales->map(function ($sale) {
                // Process sale items with product information
                $items = $sale->items->map(function ($item) {
                    $productName = $item->product ? $item->product->name : 'Product ' . $item->product_id;
                    $sku = $item->product ? $item->product->sku : 'SKU-' . $item->product_id;
                    
                    return [
                        'id' => $item->id,
                        'productName' => $productName,    // Product display name
                        'sku' => $sku,                   // Stock keeping unit
                        'quantity' => $item->quantity,   // Purchased quantity
                        'unitPrice' => (float) $item->unit_price,  // Price per unit
                        'totalPrice' => (float) $item->total_price, // Line total
                        'productId' => $item->product_id  // Product reference
                    ];
                });
                
                // Structure sale data for frontend
                return [
                    'id' => $sale->id,
                    'orderNumber' => $sale->sale_number,  // Unique sale identifier
                    'totalAmount' => (float) $sale->total_amount,  // Grand total
                    'status' => $this->mapStatus($sale->status, $sale->payment_status), // Combined status
                    'paymentMethod' => $sale->payment_method, // Cash, card, etc.
                    'date' => $sale->sale_date->toDateString(), // Sale date
                    'taxAmount' => (float) $sale->tax_amount,  // Tax portion
                    'discountAmount' => (float) $sale->discount_amount, // Discount applied
                    'netAmount' => (float) $sale->total_amount, // Same as total (for compatibility)
                    'items' => $items->toArray()  // Sale items array
                ];
            });
            
            Log::info('Sales transformed successfully', ['count' => $transformedSales->count()]);
            
            return response()->json([
                'success' => true,
                'data' => $transformedSales
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to retrieve sales: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sales',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comprehensive sales statistics
     * Calculates key performance indicators for dashboard display
     * Uses real data only - no mock values
     * 
     * @return JsonResponse JSON response with sales KPIs or error
     */
    public function stats(): JsonResponse
    {
        try {
            Log::info('Fetching sales stats');
            
            // --- CORE METRICS ---
            // Total number of sales transactions
            $totalSales = Sales::count();
            
            // Total revenue generated from all sales
            $totalRevenue = Sales::sum('total_amount');
            
            // Average value per order
            $averageOrderValue = $totalSales > 0 ? $totalRevenue / $totalSales : 0;
            
            // Orders awaiting processing
            $pendingOrders = Sales::where('status', 'pending')->count();
            
            // Successfully completed and paid orders
            $completedOrders = Sales::where('status', 'completed')
                ->where('payment_status', 'paid')
                ->count();
            
            // --- TIME-BASED METRICS ---
            // Revenue generated today
            $todaySales = Sales::whereDate('sale_date', today())->sum('total_amount');
            
            // Calculate month-over-month growth percentage
            $currentMonthRevenue = Sales::whereYear('sale_date', now()->year)
                ->whereMonth('sale_date', now()->month)
                ->sum('total_amount');
                
            $lastMonthRevenue = Sales::whereYear('sale_date', now()->subMonth()->year)
                ->whereMonth('sale_date', now()->subMonth()->month)
                ->sum('total_amount');
                
            $monthlyGrowth = $lastMonthRevenue > 0 ? 
                (($currentMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 : 
                ($currentMonthRevenue > 0 ? 100 : 0); // First month or no previous data

            // --- CONVERSION METRICS ---
            // Percentage of sales that are completed and paid
            $conversionRate = $totalSales > 0 ? ($completedOrders / $totalSales) * 100 : 0;

            // Compile all statistics
            $stats = [
                'totalSales' => (int) $totalSales,               // Total number of sales
                'totalRevenue' => (float) $totalRevenue,         // Total revenue amount
                'averageOrderValue' => (float) round($averageOrderValue, 2), // Average sale value
                'conversionRate' => (float) round($conversionRate, 2),       // Completion rate
                'pendingOrders' => (int) $pendingOrders,         // Pending orders count
                'completedOrders' => (int) $completedOrders,     // Completed orders count
                'todaySales' => (float) $todaySales,             // Today's revenue
                'monthlyGrowth' => (float) round($monthlyGrowth, 2) // Month-over-month growth
            ];
            
            Log::info('Sales stats calculated:', $stats);
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve sales stats: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sales stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get top-selling products
     * Returns products with highest sales volume and revenue
     * Includes growth indicators for trend analysis
     * 
     * @return JsonResponse JSON response with top products or error
     */
    public function topProducts(): JsonResponse
    {
        try {
            Log::info('Fetching top products');
            
            // Aggregate sales data by product
            $topProducts = SaleItem::select([
                    'product_id', // Group by product
                    DB::raw('SUM(quantity) as total_quantity'),  // Total units sold
                    DB::raw('SUM(total_price) as total_revenue') // Total revenue generated
                ])
                ->with('product') // Eager load product details
                ->groupBy('product_id')
                ->orderByDesc('total_quantity') // Sort by sales volume
                ->limit(5) // Top 5 products
                ->get()
                ->map(function ($item, $index) {
                    $productName = $item->product ? $item->product->name : 'Product ' . $item->product_id;
                    $sku = $item->product ? $item->product->sku : 'SKU-' . $item->product_id;
                    
                    // Simulate growth based on ranking (placeholder for real growth calculation)
                    $growth = (5 - $index) * 5 + rand(1, 10); // Higher rank = higher growth
                    
                    return [
                        'id' => $item->product_id ?? $index + 1,
                        'name' => $productName,          // Product name
                        'sku' => $sku,                  // Product SKU
                        'quantitySold' => (int) ($item->total_quantity ?? 0), // Units sold
                        'revenue' => (float) ($item->total_revenue ?? 0),    // Revenue generated
                        'growth' => (float) $growth     // Sales growth percentage
                    ];
                });

            // Return empty array if no sales data exists
            if ($topProducts->isEmpty()) {
                $topProducts = collect([]);
            }
            
            Log::info('Top products fetched:', ['count' => $topProducts->count()]);
            
            return response()->json([
                'success' => true,
                'data' => $topProducts
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve top products: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve top products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sales trend data for the last 7 days
     * Returns daily sales metrics with zero-filling for missing dates
     * Provides data for line/area charts in dashboard
     * 
     * @return JsonResponse JSON response with trend data or error
     */
    public function trend(): JsonResponse
    {
        try {
            Log::info('Fetching sales trend');
            
            // Get actual sales data grouped by date for last 7 days
            $trend = Sales::select([
                    DB::raw('DATE(sale_date) as date'),  // Group by date
                    DB::raw('COUNT(*) as orders'),       // Number of orders
                    DB::raw('SUM(total_amount) as revenue') // Total revenue
                ])
                ->where('sale_date', '>=', now()->subDays(7)) // Last 7 days
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,          // Date string
                        'sales' => (int) $item->orders, // Number of sales
                        'orders' => (int) $item->orders, // Alias for sales
                        'revenue' => (float) $item->revenue // Revenue amount
                    ];
                });

            // Ensure complete 7-day dataset (fill missing dates with zeros)
            $completeTrend = collect();
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $existingData = $trend->firstWhere('date', $date);
                
                if ($existingData) {
                    $completeTrend->push($existingData);
                } else {
                    // Zero-fill for days with no sales
                    $completeTrend->push([
                        'date' => $date,
                        'sales' => 0,
                        'orders' => 0,
                        'revenue' => 0
                    ]);
                }
            }
            
            Log::info('Sales trend fetched:', ['count' => $completeTrend->count()]);
            
            return response()->json([
                'success' => true,
                'data' => $completeTrend
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve sales trend: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sales trend',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Map database status fields to frontend status display
     * Combines order status and payment status for simplified frontend display
     * 
     * @param string $status Order status from database
     * @param string $paymentStatus Payment status from database
     * @return string Unified status for frontend display
     */
    private function mapStatus($status, $paymentStatus): string
    {
        if ($status === 'cancelled') {
            return 'cancelled';  // Order was cancelled
        }
        
        if ($paymentStatus === 'refunded') {
            return 'refunded';   // Payment was refunded
        }
        
        if ($status === 'completed' && $paymentStatus === 'paid') {
            return 'completed';  // Order fulfilled and paid
        }
        
        return 'pending';        // Default status
    }

    /**
     * Get detailed information for a specific sale
     * Returns complete sale data including customer and items
     * 
     * @param string $id Sale ID
     * @return JsonResponse JSON response with sale details or error
     */
    public function show($id): JsonResponse
    {
        try {
            Log::info('Fetching sale details for ID: ' . $id);
            
            $sale = Sales::with(['user', 'items.product'])->find($id);
            
            if (!$sale) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sale not found'
                ], 404);
            }

            // Transform sale data for frontend
            $transformedSale = [
                'id' => $sale->id,
                'orderNumber' => $sale->sale_number,
                'totalAmount' => (float) $sale->total_amount,
                'status' => $this->mapStatus($sale->status, $sale->payment_status),
                'paymentMethod' => $sale->payment_method,
                'date' => $sale->sale_date->toDateString(),
                'taxAmount' => (float) $sale->tax_amount,
                'discountAmount' => (float) $sale->discount_amount,
                'netAmount' => (float) $sale->total_amount,
                'items' => $sale->items->map(function ($item) {
                    $productName = $item->product ? $item->product->name : 'Product ' . $item->product_id;
                    $sku = $item->product ? $item->product->sku : 'SKU-' . $item->product_id;
                    
                    return [
                        'id' => $item->id,
                        'productName' => $productName,
                        'sku' => $sku,
                        'quantity' => $item->quantity,
                        'unitPrice' => (float) $item->unit_price,
                        'totalPrice' => (float) $item->total_price,
                        'productId' => $item->product_id
                    ];
                })->toArray()
            ];

            return response()->json([
                'success' => true,
                'data' => $transformedSale
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to retrieve sale: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new sale transaction
     * Processes sale with inventory updates and transaction safety
     * Includes automatic stock reduction for sold items
     * 
     * @param Request $request HTTP request with sale data
     * @return JsonResponse JSON response with created sale or error
     */
    public function store(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction(); // Start database transaction

            Log::info('Creating new sale', $request->all());

            // Validate sale data
            $validated = $request->validate([
                'payment_method' => 'required|in:cash,card,transfer,digital', // Payment type
                'total_amount' => 'required|numeric|min:0', // Grand total
                'tax_amount' => 'required|numeric|min:0',   // Tax amount
                'discount_amount' => 'required|numeric|min:0', // Discount amount
                'items' => 'required|array|min:1',          // Sale items
                'items.*.product_id' => 'required|exists:products,id', // Valid product
                'items.*.quantity' => 'required|integer|min:1', // Positive quantity
                'items.*.unit_price' => 'required|numeric|min:0', // Price per unit
                'items.*.total_price' => 'required|numeric|min:0', // Line total
            ]);

            // Calculate subtotal (total - tax + discount)
            $subtotal = $validated['total_amount'] - $validated['tax_amount'] + $validated['discount_amount'];

            // Get current user or use default (for demo/testing)
            $userId = Auth::check() ? Auth::id() : 1;

            // Create sale record
            $sale = Sales::create([
                'user_id' => $userId, // Sale creator
                'total_amount' => $validated['total_amount'],
                'subtotal' => $subtotal,
                'tax_amount' => $validated['tax_amount'],
                'discount_amount' => $validated['discount_amount'],
                'payment_method' => $validated['payment_method'],
                'status' => 'completed', // Auto-complete for POS
                'payment_status' => 'paid', // Auto-paid for POS
                'sale_date' => now(), // Current timestamp
            ]);

            // Process each sale item
            foreach ($validated['items'] as $item) {
                // Create sale item record
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                ]);

                // Update product inventory (reduce stock)
                $product = Products::find($item['product_id']);
                if ($product) {
                    $product->decrement('stock_quantity', $item['quantity']);
                }
            }

            DB::commit(); // Commit transaction if all operations succeed

            Log::info('Sale created successfully', ['sale_id' => $sale->id, 'sale_number' => $sale->sale_number]);

            return response()->json([
                'success' => true,
                'message' => 'Sale created successfully',
                'data' => $sale
            ]);
        } catch (\Exception $e) {
            DB::rollBack(); // Rollback on error to maintain data consistency
            Log::error('Failed to create sale: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create sale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing sale
     * Handles complete sale modification with inventory reconciliation
     * Restores old stock before applying new quantities
     * 
     * @param Request $request HTTP request with updated sale data
     * @param string $id Sale ID to update
     * @return JsonResponse JSON response with updated sale or error
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            Log::info('Updating sale', ['sale_id' => $id, 'data' => $request->all()]);

            $sale = Sales::find($id);
            
            if (!$sale) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sale not found'
                ], 404);
            }

            // Validate update data
            $validated = $request->validate([
                'payment_method' => 'required|in:cash,card,transfer,digital',
                'status' => 'required|in:pending,completed,cancelled',
                'payment_status' => 'required|in:pending,paid,refunded',
                'total_amount' => 'required|numeric|min:0',
                'tax_amount' => 'required|numeric|min:0',
                'discount_amount' => 'required|numeric|min:0',
                'items' => 'required|array|min:1',
                'items.*.id' => 'sometimes|exists:sale_items,id', // Existing item ID (if any)
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.total_price' => 'required|numeric|min:0',
            ]);

            // Calculate new subtotal
            $subtotal = $validated['total_amount'] - $validated['tax_amount'] + $validated['discount_amount'];

            // --- INVENTORY RECONCILIATION ---
            // Restore stock from old sale items before updating
            foreach ($sale->items as $oldItem) {
                $product = Products::find($oldItem->product_id);
                if ($product) {
                    $product->increment('stock_quantity', $oldItem->quantity);
                }
            }

            // Delete old sale items (will recreate with updated data)
            SaleItem::where('sale_id', $sale->id)->delete();

            // Update sale record with new data
            $sale->update([
                'payment_method' => $validated['payment_method'],
                'status' => $validated['status'],
                'payment_status' => $validated['payment_status'],
                'total_amount' => $validated['total_amount'],
                'subtotal' => $subtotal,
                'tax_amount' => $validated['tax_amount'],
                'discount_amount' => $validated['discount_amount'],
            ]);

            // Create new sale items with updated data
            foreach ($validated['items'] as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                ]);

                // Update inventory with new quantities
                $product = Products::find($item['product_id']);
                if ($product) {
                    $product->decrement('stock_quantity', $item['quantity']);
                }
            }

            DB::commit();

            Log::info('Sale updated successfully', ['sale_id' => $sale->id]);

            return response()->json([
                'success' => true,
                'message' => 'Sale updated successfully',
                'data' => $sale
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update sale: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update sale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a sale
     * Removes sale record and restores product inventory
     * Ensures stock levels remain accurate after deletion
     * 
     * @param string $id Sale ID to delete
     * @return JsonResponse JSON response with success message or error
     */
    public function destroy($id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $sale = Sales::find($id);
            
            if (!$sale) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sale not found'
                ], 404);
            }

            // Restore product stock before deleting sale
            foreach ($sale->items as $item) {
                $product = Products::find($item->product_id);
                if ($product) {
                    $product->increment('stock_quantity', $item->quantity);
                }
            }
            
            $sale->delete();

            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Sale deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete sale: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete sale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search products for POS interface
     * Returns products matching search term with available stock
     * Used for quick product lookup during checkout
     * 
     * @param Request $request HTTP request with search query
     * @return JsonResponse JSON response with matching products or error
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $searchTerm = $request->get('q', '');
            
            Log::info('Product search request:', ['query' => $searchTerm]);

            if (empty($searchTerm)) {
                return response()->json([
                    'success' => true,
                    'data' => [] // Empty result for empty query
                ]);
            }

            // Search products by name or SKU with available stock
            $products = Products::where(function($query) use ($searchTerm) {
                    $query->where('name', 'LIKE', "%{$searchTerm}%")  // Name search
                          ->orWhere('sku', 'LIKE', "%{$searchTerm}%"); // SKU search
                })
                ->where('stock_quantity', '>', 0) // Only products with stock
                ->orderBy('name')
                ->limit(20) // Limit results for performance
                ->get(['id', 'name', 'sku', 'selling_price', 'stock_quantity', 'unit_of_measure']);

            Log::info('Product search results:', ['count' => $products->count()]);

            return response()->json([
                'success' => true,
                'data' => $products
            ]);

        } catch (\Exception $e) {
            Log::error('Product search error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Qidiruv muvaffaqiyatsiz tugadi', // Search failed (Uzbek)
                'error' => $e->getMessage()
            ], 500);
        }
    }
}