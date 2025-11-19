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
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        try {
            $products = Products::orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $products,
                'message' => 'Mahsulotlar muvaffaqiyatli olindi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Mahsulotlarni olishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $product = Products::create($request->validated());

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Mahsulot muvaffaqiyatli yaratildi'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Mahsulot yaratishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $product = Products::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mahsulot topilmadi'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Mahsulot muvaffaqiyatli olindi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Mahsulotni olishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductRequest $request, string $id): JsonResponse
    {
        try {
            $product = Products::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mahsulot topilmadi'
                ], 404);
            }

            $product->update($request->validated());

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Mahsulot muvaffaqiyatli yangilandi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Mahsulotni yangilashda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
      public function destroy(Products $product): JsonResponse
    {
        try {
            // Delete all product images first
            foreach ($product->images as $image) {
                // Delete physical file
                if (Storage::disk('public')->exists($image->image_path)) {
                    Storage::disk('public')->delete($image->image_path);
                }
                // Delete image record
                $image->delete();
            }

            // Delete the product
            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Mahsulot va uning rasmlari muvaffaqiyatli o\'chirildi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Mahsulotni o\'chirishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /** 
     * Get low stock products
     */
    public function lowStock(): JsonResponse
    {
        try {
            $lowStockProducts = Products::lowStock()->get();

            return response()->json([
                'success' => true,
                'data' => $lowStockProducts,
                'message' => 'Kam qolgan mahsulotlar muvaffaqiyatli olindi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kam qolgan mahsulotlarni olishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }


public function publicIndex(Request $request): JsonResponse
{
    try {
        $perPage = $request->get('limit', 6);
        $page = $request->get('page', 1);
        
        $query = Products::with(['images' => function($query) {
            $query->orderBy('is_primary', 'desc')
                  ->orderBy('sort_order', 'asc');
        }]);

        $products = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'total' => $products->total(),
            'current_page' => $products->currentPage(),
            'per_page' => $products->perPage(),
            'last_page' => $products->lastPage(),
            'message' => 'Mahsulotlar muvaffaqiyatli olindi'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Mahsulotlarni olishda xatolik',
            'error' => $e->getMessage()
        ], 500);
    }
}   /**
     * Update stock quantity
     */
    public function updateStock(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'stock_quantity' => 'required|integer|min:0',
        ], [
            'stock_quantity.required' => 'Qoldiq soni majburiy',
            'stock_quantity.integer' => 'Qoldiq soni butun son bo\'lishi kerak',
            'stock_quantity.min' => 'Qoldiq soni 0 dan katta yoki teng bo\'lishi kerak',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validatsiyada xatolik',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $product = Products::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mahsulot topilmadi'
                ], 404);
            }

            $product->update([
                'stock_quantity' => $request->stock_quantity
            ]);

            return response()->json([
                'success' => true,
                'data' => $product,
                'message' => 'Qoldiq soni muvaffaqiyatli yangilandi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Qoldiq sonini yangilashda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}