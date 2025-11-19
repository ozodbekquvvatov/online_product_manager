<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AutoSaleItemsSeeder extends Seeder
{
    public function run(): void
    {
        $saleItems = [];

        // For each sale, create 1-3 items
        for ($saleId = 1; $saleId <= 20; $saleId++) {
            $numberOfItems = rand(1, 3);
            $usedProductIds = [];

            for ($item = 0; $item < $numberOfItems; $item++) {
                $productId = $this->getUniqueProductId($usedProductIds);
                $usedProductIds[] = $productId;

                $quantity = rand(1, 3);
                
                // Get product price from products table
                $product = DB::table('products')->where('id', $productId)->first();
                $unitPrice = $product ? $product->selling_price : rand(1000, 50000) / 100;
                $totalPrice = $quantity * $unitPrice;

                $saleItems[] = [
                    'sale_id' => $saleId,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_price' => round($unitPrice, 2),
                    'total_price' => round($totalPrice, 2),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ];
            }
        }

        DB::table('sale_items')->insert($saleItems);
        
        $this->command->info('✅ Sale items created successfully!');
    }

    private function getUniqueProductId(array $usedIds): int
    {
        do {
            $productId = rand(1, 10); // Assuming 10 products exist
        } while (in_array($productId, $usedIds));

        return $productId;
    }
}