<?php

namespace App\Http\Controllers\Admin;

use App\Models\Products;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;

class ProductController extends Controller
{
    /**
     * Get all products listing (Admin)
     * Returns all products ordered by creation date (newest first)
     * Used for admin panel product management
     * 
     * @return JsonResponse JSON response with products array or error
     */
    public function index(): JsonResponse
    {
        try {
            // Fetch all products, most recent first for admin convenience
            $products = Products::orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $products,
                'message' => 'Products retrieved successfully'
            ]);
        } catch (\Exception $e) {
            // Handle database connection or query errors
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new product (Admin)
     * Validates input using StoreProductRequest and creates product record
     * 
     * @param StoreProductRequest $request Validated product creation data
     * @return JsonResponse JSON response with created product or error
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            // Create product using validated data from form request
            $product = Products::create($request->validated());

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Product created successfully'
            ], 201); // HTTP 201 Created status
        } catch (\Exception $e) {
            // Handle validation, database, or creation errors
            return response()->json([
                'success' => false,
                'message' => 'Error creating product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific product details (Admin)
     * Retrieves single product by ID with error handling
     * 
     * @param string $id Product ID
     * @return JsonResponse JSON response with product data or error
     */
    public function show(string $id): JsonResponse
    {
        try {
            // Find product by primary key
            $product = Products::find($id);

            // Return 404 if product doesn't exist
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Product retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update existing product (Admin)
     * Validates input, finds product, and updates with validated data
     * 
     * @param UpdateProductRequest $request Validated product update data
     * @param string $id Product ID to update
     * @return JsonResponse JSON response with updated product or error
     */
    public function update(UpdateProductRequest $request, string $id): JsonResponse
    {
        try {
            // Find product record
            $product = Products::find($id);

            // Return 404 if product not found
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            // Update product with validated data
            $product->update($request->validated());

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Product updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete product and its associated images (Admin)
     * Soft deletes product and physically removes image files
     * Uses Laravel model binding for automatic dependency resolution
     * 
     * @param Products $product Product model instance (auto-resolved via route model binding)
     * @return JsonResponse JSON response with success message or error
     */
    public function destroy(Products $product): JsonResponse
    {
        try {
            // --- DELETE PRODUCT IMAGES ---
            // Loop through all associated product images
            foreach ($product->images as $image) {
                // Delete physical image file from storage
                if (Storage::disk('public')->exists($image->image_path)) {
                    Storage::disk('public')->delete($image->image_path);
                }
                // Delete image database record
                $image->delete();
            }

            // --- DELETE PRODUCT RECORD ---
            // Soft delete product (if using SoftDeletes trait)
            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Product and its images deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get low stock products (Admin)
     * Returns products where stock quantity is at or below reorder level
     * Uses Products model scope (lowStock) for clean query
     * 
     * @return JsonResponse JSON response with low stock products or error
     */
    public function lowStock(): JsonResponse
    {
        try {
            // Use model scope to get low stock products
            $lowStockProducts = Products::lowStock()->get();

            return response()->json([
                'success' => true,
                'data' => $lowStockProducts,
                'message' => 'Low stock products retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving low stock products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get paginated products for public storefront
     * Includes eager-loaded images with primary image first
     * Supports pagination with customizable items per page
     * 
     * @param Request $request HTTP request with pagination parameters
     * @return JsonResponse JSON response with paginated products
     */
    public function publicIndex(Request $request): JsonResponse
    {
        try {
            // Pagination parameters with defaults
            $perPage = $request->get('limit', 6);     // Items per page (default: 6)
            $page = $request->get('page', 1);         // Current page (default: 1)
            
            // Build query with eager-loaded images
            $query = Products::with(['images' => function($query) {
                // Order images: primary first, then by sort order
                $query->orderBy('is_primary', 'desc')
                      ->orderBy('sort_order', 'asc');
            }]);

            // Execute paginated query
            $products = $query->paginate($perPage, ['*'], 'page', $page);

            // Return comprehensive pagination response
            return response()->json([
                'success' => true,
                'data' => $products->items(),          // Current page items
                'total' => $products->total(),         // Total items in database
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'last_page' => $products->lastPage(),
                'message' => 'Products retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update product stock quantity (Admin)
     * Manually update stock levels with validation
     * Separate from general update for specific stock management
     * 
     * @param Request $request HTTP request with stock_quantity field
     * @param string $id Product ID
     * @return JsonResponse JSON response with updated product or validation errors
     */
    public function updateStock(Request $request, string $id): JsonResponse
    {
        // Validate stock quantity input
        $validator = Validator::make($request->all(), [
            'stock_quantity' => 'required|integer|min:0',
        ], [
            'stock_quantity.required' => 'Stock quantity is required',
            'stock_quantity.integer' => 'Stock quantity must be an integer',
            'stock_quantity.min' => 'Stock quantity must be 0 or greater',
        ]);

        // Return validation errors if present
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422); // HTTP 422 Unprocessable Entity
        }

        try {
            // Find product
            $product = Products::find($id);

            // Return 404 if product not found
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            // Update only the stock quantity field
            $product->update([
                'stock_quantity' => $request->stock_quantity
            ]);

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Stock quantity updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating stock quantity',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}