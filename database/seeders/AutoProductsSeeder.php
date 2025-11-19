<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AutoProductsSeeder extends Seeder
{
    public function run(): void
    {
        $products = [];

        $productNames = [
            'Laptop Computer', 'Wireless Mouse', 'Mechanical Keyboard', '27-inch Monitor',
            'Webcam HD', 'USB-C Hub', 'Bluetooth Headphones', 'External SSD 1TB',
            'Laptop Stand', 'Wireless Charger'
        ];

        for ($i = 0; $i < 10; $i++) {
            $costPrice = rand(1000, 2000) + (rand(0, 99) / 100);
            $sellingPrice = $costPrice * (1 + (rand(30, 100) / 100)); // 30-100% markup
            $profitMargin = (($sellingPrice - $costPrice) / $sellingPrice) * 100;

            $products[] = [
                'name' => $productNames[$i],
                'cost_price' => round($costPrice, 2),
                'selling_price' => round($sellingPrice, 2),
                'stock_quantity' => rand(0, 100),
                'reorder_level' => rand(5, 20),
                'unit_of_measure' => 'pcs',
                'description' => 'High-quality ' . $productNames[$i] . ' for professional use',
                'is_active' => true,
                'profit_margin' => round($profitMargin, 2),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];
        }

        DB::table('products')->insert($products);
        
        $this->command->info('✅ 10 products created successfully!');
    }
}