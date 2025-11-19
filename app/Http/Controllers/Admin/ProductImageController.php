<?php

namespace App\Http\Controllers\Admin;

use App\Models\Products;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use App\Http\Requests\StoreProductImageRequest;

class ProductImageController extends Controller
{
    public function index(Products $product): JsonResponse
    {
        try {
            $images = $product->images;

            return response()->json([
                'success' => true,
                'data' => $images,
                'message' => 'Mahsulot rasmlari muvaffaqiyatli olindi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rasmlarni olishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request, Products $product): JsonResponse
{
    Log::info('🖼️ ProductImageController store method called');
    Log::info('🖼️ Product ID: ' . $product->id);
    Log::info('🖼️ Request files: ', $request->allFiles());

    try {
        $request->validate([
            'images' => 'required|array|min:1|max:10',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

    Log::info('🖼️ Validation passed');

        $uploadedImages = [];
        
        foreach ($request->file('images') as $index => $image) {
            Log::info("🖼️ Processing image {$index}: " . $image->getClientOriginalName());
            
            // Store image
            $path = $image->store('products', 'public');
            Log::info("🖼️ Image stored at: {$path}");
            
            // Create image record
            $productImage = ProductImage::create([
                'product_id' => $product->id,
                'image_path' => $path,
                'image_name' => $image->getClientOriginalName(),
                'file_size' => $image->getSize(),
                'mime_type' => $image->getMimeType(),
                'is_primary' => $index === 0 && $product->images()->count() === 0,
                'sort_order' => $product->images()->count() + $index,
                'alt_text' => $product->name
            ]);

            Log::info("🖼️ ProductImage created with ID: {$productImage->id}");
            $uploadedImages[] = $productImage;
        }

        Log::info('🖼️ All images uploaded successfully');

        return response()->json([
            'success' => true,
            'data' => $uploadedImages,
            'message' => 'Rasmlar muvaffaqiyatli yuklandi'
        ], 201);
    } catch (\Exception $e) {
        Log::error('🖼️ Error in ProductImageController store: ' . $e->getMessage());
        Log::error('🖼️ Stack trace: ' . $e->getTraceAsString());

        // Clean up any uploaded files if there was an error
        if (isset($uploadedImages) && count($uploadedImages) > 0) {
            foreach ($uploadedImages as $uploadedImage) {
                if (Storage::disk('public')->exists($uploadedImage->image_path)) {
                    Storage::disk('public')->delete($uploadedImage->image_path);
                }
            }
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Rasmlarni yuklashda xatolik: ' . $e->getMessage(),
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function setPrimary(Products $product, ProductImage $image): JsonResponse
    {
        try {
            // Check if image belongs to product
            if ($image->product_id !== $product->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rasm ushbu mahsulotga tegishli emas'
                ], 404);
            }

            // Remove primary status from all images
            $product->images()->update(['is_primary' => false]);

            // Set this image as primary
            $image->update(['is_primary' => true]);

            return response()->json([
                'success' => true,
                'data' => $image,
                'message' => 'Asosiy rasm muvaffaqiyatli o\'rnatildi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Asosiy rasmni o\'rnatishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Products $product, ProductImage $image): JsonResponse
    {
        try {
            // Check if image belongs to product
            if ($image->product_id !== $product->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rasm ushbu mahsulotga tegishli emas'
                ], 404);
            }

            // Store image path before deletion
            $imagePath = $image->image_path;
            $wasPrimary = $image->is_primary;

            // Delete image record
            $image->delete();

            // Delete physical file
            if (Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }

            // If deleted image was primary, set a new primary
            if ($wasPrimary && $product->images()->count() > 0) {
                $newPrimary = $product->images()->first();
                $newPrimary->update(['is_primary' => true]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Rasm muvaffaqiyatli o\'chirildi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rasmni o\'chirishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reorder(Request $request, Products $product): JsonResponse
    {
        try {
            $request->validate([
                'image_order' => 'required|array',
                'image_order.*' => 'integer|exists:product_images,id'
            ]);

            foreach ($request->image_order as $order => $imageId) {
                ProductImage::where('id', $imageId)
                    ->where('product_id', $product->id)
                    ->update(['sort_order' => $order]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Rasmlar tartibi muvaffaqiyatli yangilandi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rasmlar tartibini yangilashda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete multiple images at once
     */
    public function destroyMultiple(Request $request, Products $product): JsonResponse
    {
        try {
            $request->validate([
                'image_ids' => 'required|array',
                'image_ids.*' => 'integer|exists:product_images,id'
            ]);

            $images = ProductImage::where('product_id', $product->id)
                ->whereIn('id', $request->image_ids)
                ->get();

            $deletedPaths = [];
            $wasPrimary = false;

            foreach ($images as $image) {
                $deletedPaths[] = $image->image_path;
                if ($image->is_primary) {
                    $wasPrimary = true;
                }
                $image->delete();
            }

            // Delete physical files
            foreach ($deletedPaths as $path) {
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }

            // If primary image was deleted, set a new primary
            if ($wasPrimary && $product->images()->count() > 0) {
                $newPrimary = $product->images()->first();
                $newPrimary->update(['is_primary' => true]);
            }

            return response()->json([
                'success' => true,
                'message' => count($images) . ' ta rasm muvaffaqiyatli o\'chirildi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rasmlarni o\'chirishda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Replace an existing image with a new one
     */
    public function update(Request $request, Products $product, ProductImage $image): JsonResponse
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            ]);

            // Check if image belongs to product
            if ($image->product_id !== $product->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rasm ushbu mahsulotga tegishli emas'
                ], 404);
            }

            // Store old image path
            $oldImagePath = $image->image_path;

            // Upload new image
            $newImage = $request->file('image');
            $newPath = $newImage->store('products', 'public');

            // Update image record
            $image->update([
                'image_path' => $newPath,
                'image_name' => $newImage->getClientOriginalName(),
                'file_size' => $newImage->getSize(),
                'mime_type' => $newImage->getMimeType(),
            ]);

            // Delete old physical file
            if (Storage::disk('public')->exists($oldImagePath)) {
                Storage::disk('public')->delete($oldImagePath);
            }

            return response()->json([
                'success' => true,
                'data' => $image,
                'message' => 'Rasm muvaffaqiyatli yangilandi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rasmni yangilashda xatolik',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}