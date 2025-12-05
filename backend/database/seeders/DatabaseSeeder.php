<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Sales;
use App\Models\Products;
use App\Models\SaleItem;
use App\Models\Employees;
use Illuminate\Support\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

              $this->call(AdminUserSeeder::class);

 $this->call([
            AdminUserSeeder::class,
            AutoEmployeesSeeder::class,
            AutoProductsSeeder::class,
            AutoSalesSeeder::class,
            AutoSaleItemsSeeder::class,
        ]);
}
}