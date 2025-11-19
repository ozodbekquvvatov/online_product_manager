<?php

namespace App\Http\Controllers\Admin;

use App\Models\Product;
use App\Models\Products;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class InventoryController extends Controller
{
    public function stats(): JsonResponse
    {
        try {
            $totalProducts = Products::count();
            $lowStockItems = Products::whereColumn('stock_quantity', '<=', 'reorder_level')->count();
            $outOfStockItems = Products::where('stock_quantity', 0)->count();
            
            $totalValue = Products::get()->sum(function($product) {
                return $product->cost_price * $product->stock_quantity;
            });

            $stats = [
                'totalProducts' => $totalProducts,
                'totalValue' => $totalValue,
                'lowStockItems' => $lowStockItems,
                'outOfStockItems' => $outOfStockItems,
                'totalCategories' => 1, // You can implement categories later
                'inventoryTurnover' => 0, // You can calculate this based on sales
                'stockValue' => $totalValue,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Inventory stats retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve inventory stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}