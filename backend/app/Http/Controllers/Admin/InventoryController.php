<?php

namespace App\Http\Controllers\Admin;

use App\Models\Product;
use App\Models\Products;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class InventoryController extends Controller
{
    /**
     * Get comprehensive inventory statistics
     * Calculates key inventory metrics for dashboard display
     * 
     * @return JsonResponse JSON response with inventory stats or error
     */
    public function stats(): JsonResponse
    {
        try {
            // --- BASIC INVENTORY COUNTS ---
            // Total number of products in the system
            $totalProducts = Products::count();
            
            // Products at or below reorder level (needs restocking)
            $lowStockItems = Products::whereColumn('stock_quantity', '<=', 'reorder_level')->count();
            
            // Products completely out of stock
            $outOfStockItems = Products::where('stock_quantity', 0)->count();
            
            // --- FINANCIAL CALCULATIONS ---
            // Calculate total inventory value (cost price × quantity)
            $totalValue = Products::get()->sum(function($product) {
                return $product->cost_price * $product->stock_quantity;
            });

            // --- COMPREHENSIVE STATISTICS ARRAY ---
            $stats = [
                // Product Count Metrics
                'totalProducts' => $totalProducts,           // Total products in inventory
                'lowStockItems' => $lowStockItems,          // Products needing restock
                'outOfStockItems' => $outOfStockItems,      // Zero stock items
                
                // Financial Metrics
                'totalValue' => $totalValue,                // Total inventory value at cost
                'stockValue' => $totalValue,                // Alias for totalValue
                
                // Placeholder Metrics (for future implementation)
                'totalCategories' => 1,                     // TODO: Implement category counting
                'inventoryTurnover' => 0,                   // TODO: Calculate based on sales history
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Inventory stats retrieved successfully'
            ]);

        } catch (\Exception $e) {
            // Handle database errors or calculation issues
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve inventory stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}