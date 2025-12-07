<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\AdminUser;

class AutoSalesSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing admin user IDs
        $adminUserIds = AdminUser::pluck('id')->toArray();
        
        // If no admin users exist, use null
        if (empty($adminUserIds)) {
            $adminUserIds = [null];
        }

        $sales = [];
        $saleCounter = 1;

        // Generate sales for the last 7 days including today
        for ($day = 0; $day < 7; $day++) {
            $saleDate = Carbon::now()->subDays($day);
            
            // Generate 2-5 sales per day
            $salesPerDay = rand(2, 5);
            
            for ($i = 0; $i < $salesPerDay; $i++) {
                // Get a random existing admin user ID or use null
                $userId = !empty($adminUserIds) ? $adminUserIds[array_rand($adminUserIds)] : null;
                
                $subtotal = $this->generateAmount(50, 500);
                $taxRate = 0.08; // 8% tax
                $discountRate = rand(5, 15) / 100; // 5-15% discount
                $discountAmount = round($subtotal * $discountRate, 2);
                $taxAmount = round(($subtotal - $discountAmount) * $taxRate, 2);
                $totalAmount = round(($subtotal - $discountAmount) + $taxAmount, 2);
                
                // Generate random time for the sale within the day
                $saleDateTime = $saleDate->copy()
                    ->setTime(rand(9, 20), rand(0, 59), rand(0, 59));

                $sales[] = [
                    'sale_number' => 'SALE' . date('Y') . str_pad($saleCounter, 6, '0', STR_PAD_LEFT),
                    'user_id' => $userId,
                    'sale_date' => $saleDateTime->format('Y-m-d H:i:s'),
                    'subtotal' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'payment_method' => $this->generatePaymentMethod(),
                    'payment_status' => $this->generatePaymentStatus(),
                    'status' => $this->generateSaleStatus(),
                    'notes' => $this->generateNotes(),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ];
                
                $saleCounter++;
            }
        }

        DB::table('sales')->insert($sales);
        $this->command->info('✅ ' . count($sales) . ' sales created for the last 7 days!');
        
        // Show date range
        $firstSaleDate = Carbon::parse($sales[0]['sale_date'])->format('Y-m-d');
        $lastSaleDate = Carbon::parse($sales[count($sales) - 1]['sale_date'])->format('Y-m-d');
        $this->command->info("📅 Date range: $firstSaleDate to $lastSaleDate");
    }

    private function generateAmount($min, $max): float
    {
        return round(rand($min * 100, $max * 100) / 100, 2);
    }

    private function generatePaymentMethod(): string
    {
        // SAFEST OPTION: Use only 'cash' and 'card' which are universally accepted
        $methods = ['cash', 'card'];
        return $methods[array_rand($methods)];
        
        // If you want more variety but still safe:
        // $methods = ['cash', 'card', 'transfer'];
        // return $methods[array_rand($methods)];
    }

    private function generatePaymentStatus(): string
    {
        $statuses = ['paid', 'pending', 'partial', 'refunded'];
        return $statuses[array_rand($statuses)];
    }

    private function generateSaleStatus(): string
    {
        $statuses = ['completed', 'pending', 'cancelled'];
        $weights = [80, 15, 5]; // 80% completed, 15% pending, 5% cancelled
        
        $rand = rand(1, 100);
        $cumulative = 0;
        
        foreach ($weights as $index => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return $statuses[$index];
            }
        }
        
        return 'completed';
    }

    private function generateNotes(): string
    {
        $notes = [
            'Regular customer',
            'Online order',
            'Walk-in customer',
            'Phone order',
            'First-time buyer',
            'Bulk order discount applied',
            'Special promotion',
            'Corporate purchase',
            'Gift purchase',
            'Return exchange',
            'Loyalty program member',
            'Same day delivery',
            'Pickup order',
            'Staff purchase',
            'Student discount'
        ];
        return $notes[array_rand($notes)];
    }
}