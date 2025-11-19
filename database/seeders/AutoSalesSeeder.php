<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AutoSalesSeeder extends Seeder
{
    public function run(): void
    {
        $sales = [];

        for ($i = 1; $i <= 20; $i++) {
            $subtotal = rand(5000, 50000) / 100; // $50 to $500
            $taxAmount = $subtotal * 0.08; // 8% tax
            $discountAmount = rand(0, $subtotal * 0.2 * 100) / 100; // Up to 20% discount
            $totalAmount = $subtotal + $taxAmount - $discountAmount;

            $statuses = ['pending', 'completed', 'cancelled'];
            $paymentStatuses = ['pending', 'paid', 'partial', 'refunded'];
            $paymentMethods = ['cash', 'card', 'transfer', 'credit'];

            $sales[] = [
                'sale_number' => 'SALE2023' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'sale_date' => now()->subDays(rand(1, 180))->format('Y-m-d'),
                'subtotal' => round($subtotal, 2),
                'tax_amount' => round($taxAmount, 2),
                'discount_amount' => round($discountAmount, 2),
                'total_amount' => round($totalAmount, 2),
                'status' => $statuses[array_rand($statuses)],
                'payment_status' => $paymentStatuses[array_rand($paymentStatuses)],
                'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                'notes' => $this->generateNotes(),
                'user_id' => rand(1, 10), // Assuming 10 employees exist
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];
        }

        DB::table('sales')->insert($sales);
        $this->command->info('✅ 10 sales created successfully!');
    }

    private function generateNotes(): string
    {
        $notes = [
            'Walk-in customer',
            'Online order',
            'Phone order',
            'Regular customer',
            'First-time buyer',
            'Bulk order discount applied'
        ];
        return $notes[array_rand($notes)];
    }
}