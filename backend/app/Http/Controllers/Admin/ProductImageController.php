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
    /**
     * Get all images for a specific product
     * Returns complete list of images associated with the given product
     * Uses Laravel route model binding for automatic product resolution
     * 
     * @param Products $product Product model instance (auto-resolved)
     * @return JsonResponse JSON response with product images or error
     */
    public function index(Products $product): JsonResponse
    {
        try {
            // Get all images associated with the product via relationship
            $images = $product->images;

            return response()->json([
                'success' => true,
                'data' => $images,
                'message' => 'Product images retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving images',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload multiple images for a product
     * Handles bulk image upload with comprehensive validation and logging
     * Supports up to 10 images per upload with automatic primary image assignment
     * 
     * @param Request $request HTTP request containing image files
     * @param Products $product Product model instance (auto-resolved)
     * @return JsonResponse JSON response with uploaded images or error
     */
    public function store(Request $request, Products $product): JsonResponse
    {
        // Detailed logging for debugging file upload issues
        Log::info('🖼️ ProductImageController store method called');
        Log::info('🖼️ Product ID: ' . $product->id);
        Log::info('🖼️ Request files: ', $request->allFiles());

        try {
            // Validate uploaded images
            $request->validate([
                'images' => 'required|array|min:1|max:10',          // 1-10 images allowed
                'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max per image
            ]);

            Log::info('🖼️ Validation passed');

            $uploadedImages = [];
            
            // Process each uploaded image
            foreach ($request->file('images') as $index => $image) {
                Log::info("🖼️ Processing image {$index}: " . $image->getClientOriginalName());
                
                // Store image in public storage under 'products' directory
                $path = $image->store('products', 'public');
                Log::info("🖼️ Image stored at: {$path}");
                
                // Create database record for the image
                $productImage = ProductImage::create([
                    'product_id' => $product->id,                    // Link to product
                    'image_path' => $path,                           // Storage path
                    'image_name' => $image->getClientOriginalName(), // Original filename
                    'file_size' => $image->getSize(),                // File size in bytes
                    'mime_type' => $image->getMimeType(),            // MIME type
                    // Set as primary if it's the first image and product has no images yet
                    'is_primary' => $index === 0 && $product->images()->count() === 0,
                    // Calculate sort order based on existing images + current index
                    'sort_order' => $product->images()->count() + $index,
                    'alt_text' => $product->name                     // Default alt text
                ]);

                Log::info("🖼️ ProductImage created with ID: {$productImage->id}");
                $uploadedImages[] = $productImage;
            }

            Log::info('🖼️ All images uploaded successfully');

            return response()->json([
                'success' => true,
                'data' => $uploadedImages,
                'message' => 'Images uploaded successfully'
            ], 201); // HTTP 201 Created
        } catch (\Exception $e) {
            // Detailed error logging with stack trace
            Log::error('🖼️ Error in ProductImageController store: ' . $e->getMessage());
            Log::error('🖼️ Stack trace: ' . $e->getTraceAsString());

            // Clean up any uploaded files if error occurred (transaction rollback)
            if (isset($uploadedImages) && count($uploadedImages) > 0) {
                foreach ($uploadedImages as $uploadedImage) {
                    if (Storage::disk('public')->exists($uploadedImage->image_path)) {
                        Storage::disk('public')->delete($uploadedImage->image_path);
                    }
                }
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Error uploading images: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set a specific image as primary/featured for the product
     * Only one image can be primary at a time - automatically unsets others
     * 
     * @param Products $product Product model instance
     * @param ProductImage $image Image model instance to set as primary
     * @return JsonResponse JSON response with updated image or error
     */
    public function setPrimary(Products $product, ProductImage $image): JsonResponse
    {
        try {
            // Security check: Ensure image belongs to the specified product
            if ($image->product_id !== $product->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Image does not belong to this product'
                ], 404);
            }

            // Remove primary status from all images of this product
            $product->images()->update(['is_primary' => false]);

            // Set the specified image as primary
            $image->update(['is_primary' => true]);

            return response()->json([
                'success' => true,
                'data' => $image,
                'message' => 'Primary image set successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error setting primary image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a single product image
     * Removes both database record and physical file
     * Handles primary image reassignment if needed
     * 
     * @param Products $product Product model instance
     * @param ProductImage $image Image model instance to delete
     * @return JsonResponse JSON response with success message or error
     */
    public function destroy(Products $product, ProductImage $image): JsonResponse
    {
        try {
            // Security check: Ensure image belongs to the specified product
            if ($image->product_id !== $product->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Image does not belong to this product'
                ], 404);
            }

            // Store image details before deletion for cleanup and reassignment
            $imagePath = $image->image_path;
            $wasPrimary = $image->is_primary;

            // Delete image database record
            $image->delete();

            // Delete physical file from storage
            if (Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }

            // If deleted image was primary, assign primary status to first remaining image
            if ($wasPrimary && $product->images()->count() > 0) {
                $newPrimary = $product->images()->first();
                $newPrimary->update(['is_primary' => true]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Image deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder product images
     * Updates sort_order for multiple images in a single request
     * Used for drag-and-drop reordering in admin interface
     * 
     * @param Request $request HTTP request with image order array
     * @param Products $product Product model instance
     * @return JsonResponse JSON response with success message or error
     */
    public function reorder(Request $request, Products $product): JsonResponse
    {
        try {
            // Validate image order array
            $request->validate([
                'image_order' => 'required|array',
                'image_order.*' => 'integer|exists:product_images,id'
            ]);

            // Update sort_order for each image based on position in array
            foreach ($request->image_order as $order => $imageId) {
                ProductImage::where('id', $imageId)
                    ->where('product_id', $product->id) // Security check
                    ->update(['sort_order' => $order]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Image order updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating image order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete multiple images at once
     * Bulk deletion for better performance when removing many images
     * Handles primary image reassignment and physical file cleanup
     * 
     * @param Request $request HTTP request with array of image IDs
     * @param Products $product Product model instance
     * @return JsonResponse JSON response with success message or error
     */
    public function destroyMultiple(Request $request, Products $product): JsonResponse
    {
        try {
            $request->validate([
                'image_ids' => 'required|array',
                'image_ids.*' => 'integer|exists:product_images,id'
            ]);

            // Get images that belong to this product and are in the deletion list
            $images = ProductImage::where('product_id', $product->id)
                ->whereIn('id', $request->image_ids)
                ->get();

            $deletedPaths = [];
            $wasPrimary = false;

            // Delete each image record
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

            // Reassign primary if necessary
            if ($wasPrimary && $product->images()->count() > 0) {
                $newPrimary = $product->images()->first();
                $newPrimary->update(['is_primary' => true]);
            }

            return response()->json([
                'success' => true,
                'message' => count($images) . ' images deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting images',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Replace/update an existing image
     * Replaces image file while preserving database record and metadata
     * Useful for fixing corrupted images or updating image quality
     * 
     * @param Request $request HTTP request with new image file
     * @param Products $product Product model instance
     * @param ProductImage $image Image model instance to update
     * @return JsonResponse JSON response with updated image or error
     */
    public function update(Request $request, Products $product, ProductImage $image): JsonResponse
    {
        try {
            // Validate new image file
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            ]);

            // Security check: Ensure image belongs to the specified product
            if ($image->product_id !== $product->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Image does not belong to this product'
                ], 404);
            }

            // Store old image path for cleanup
            $oldImagePath = $image->image_path;

            // Upload new image
            $newImage = $request->file('image');
            $newPath = $newImage->store('products', 'public');

            // Update image record with new file details
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
                'message' => 'Image updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating image',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}