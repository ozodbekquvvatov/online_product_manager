<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    /**
     * Get comprehensive dashboard metrics for the admin panel
     * Fetches key business indicators: revenue, expenses, profit, inventory, etc.
     * 
     * @param Request $request HTTP request object
     * @return \Illuminate\Http\JsonResponse JSON response with metrics data
     */
    public function getMetrics(Request $request)
    {
        // Initialize metrics array with default values
        $metrics = [
            'totalRevenue' => 0,
            'totalExpenses' => 0,
            'netProfit' => 0,
            'profitMargin' => 0,
            'totalEmployees' => 0,
            'totalProducts' => 0,
            'totalSales' => 0,
            'lowStockItems' => 0,
            'cashBalance' => 0,
            'accountsReceivable' => 0,
        ];

        try {
            // --- REVENUE & SALES METRICS ---
            // Check if sales table exists before querying
            if (Schema::hasTable('sales')) {
                // Calculate total revenue from completed sales
                $totalRevenue = DB::table('sales')
                    ->when(Schema::hasColumn('sales', 'status'), function ($query) {
                        // Filter by status if column exists (flexible schema)
                        return $query->where('status', 'completed');
                    })
                    ->sum('total_amount');
                $metrics['totalRevenue'] = floatval($totalRevenue ?? 0);
                
                // Count total number of completed sales transactions
                $metrics['totalSales'] = DB::table('sales')
                    ->when(Schema::hasColumn('sales', 'status'), function ($query) {
                        return $query->where('status', 'completed');
                    })
                    ->count();
                
                // Calculate accounts receivable (pending payments)
                if (Schema::hasColumn('sales', 'payment_status')) {
                    $accountsReceivable = DB::table('sales')
                        ->where('payment_status', 'pending')
                        ->sum('total_amount');
                    $metrics['accountsReceivable'] = floatval($accountsReceivable ?? 0);
                }
            }

            // --- EXPENSES METRICS ---
            // Calculate total expenses if expenses table exists
            if (Schema::hasTable('expenses')) {
                $totalExpenses = DB::table('expenses')->sum('amount');
                $metrics['totalExpenses'] = floatval($totalExpenses ?? 0);
            }

            // --- PROFIT CALCULATIONS ---
            // Net profit = Revenue - Expenses
            $metrics['netProfit'] = $metrics['totalRevenue'] - $metrics['totalExpenses'];
            
            // Profit margin percentage (profit/revenue * 100)
            $metrics['profitMargin'] = $metrics['totalRevenue'] > 0 
                ? round(($metrics['netProfit'] / $metrics['totalRevenue']) * 100, 2) 
                : 0;

            // --- EMPLOYEE METRICS ---
            // Count active employees if employees table exists
            if (Schema::hasTable('employees')) {
                $metrics['totalEmployees'] = DB::table('employees')
                    ->when(Schema::hasColumn('employees', 'is_active'), function ($query) {
                        return $query->where('is_active', true);
                    })
                    ->count();
            }

            // --- PRODUCT & INVENTORY METRICS ---
            // Count active products and low stock items
            if (Schema::hasTable('products')) {
                $metrics['totalProducts'] = DB::table('products')
                    ->when(Schema::hasColumn('products', 'is_active'), function ($query) {
                        return $query->where('is_active', true);
                    })
                    ->count();
                
                // Check for low stock items (stock <= reorder level)
                if (Schema::hasColumn('products', 'stock_quantity') && 
                    Schema::hasColumn('products', 'reorder_level')) {
                    $lowStockItems = DB::table('products')
                        ->when(Schema::hasColumn('products', 'is_active'), function ($query) {
                            return $query->where('is_active', true);
                        })
                        ->whereRaw('stock_quantity <= reorder_level')
                        ->count();
                    $metrics['lowStockItems'] = intval($lowStockItems);
                }
            }

            // --- FINANCIAL BALANCE METRICS ---
            // Get cash balance from accounts table
            if (Schema::hasTable('accounts')) {
                if (Schema::hasColumn('accounts', 'balance')) {
                    $cashBalance = DB::table('accounts')
                        ->when(Schema::hasColumn('accounts', 'type'), function ($query) {
                            return $query->where('type', 'cash'); // Filter cash accounts
                        })
                        ->value('balance');
                    $metrics['cashBalance'] = floatval($cashBalance ?? 0);
                }
            }

            // Return successful response with metrics data
            return response()->json([
                'success' => true,
                'data' => $metrics
            ]);

        } catch (\Exception $e) {
            // Return error response if any exception occurs
            return response()->json([
                'success' => false,
                'message' => 'Error fetching dashboard metrics',
                'data' => $metrics // Return partial data even on error
            ], 500);
        }
    }

    /**
     * Get sales trend data for the last 6 months
     * Provides monthly sales and profit data for charts/graphs
     * 
     * @param Request $request HTTP request object
     * @return \Illuminate\Http\JsonResponse JSON response with trend data
     */
    public function getSalesTrend(Request $request)
    {
        try {
            // Month abbreviations for display
            $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            $formattedData = [];

            // Generate data structure for last 6 months
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $monthKey = $monthNames[$date->month - 1] . ' ' . $date->year;
                
                $formattedData[] = [
                    'month' => $monthKey,      // Display format: "Jan 2024"
                    'sales' => 0,              // Sales amount
                    'profit' => 0,             // Profit amount
                    'raw_month' => $date->month, // Internal month number
                    'raw_year' => $date->year    // Internal year
                ];
            }

            // Fetch actual sales data from database if table exists
            if (Schema::hasTable('sales')) {
                $salesData = DB::table('sales')
                    ->select(
                        DB::raw('MONTH(created_at) as month'),
                        DB::raw('YEAR(created_at) as year'),
                        DB::raw('COALESCE(SUM(total_amount), 0) as sales')
                    )
                    ->where('created_at', '>=', now()->subMonths(6)) // Last 6 months
                    ->when(Schema::hasColumn('sales', 'status'), function ($query) {
                        return $query->where('status', 'completed');
                    })
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'asc')
                    ->orderBy('month', 'asc')
                    ->get();

                // Map actual sales data to formatted structure
                foreach ($formattedData as &$monthData) {
                    foreach ($salesData as $sale) {
                        // Match month and year
                        if ($sale->month == $monthData['raw_month'] && 
                            $sale->year == $monthData['raw_year']) {
                            $salesAmount = floatval($sale->sales);
                            $monthData['sales'] = $salesAmount;
                            
                            // Calculate profit (sales minus expenses for that month)
                            $profit = $salesAmount;
                            
                            if (Schema::hasTable('expenses')) {
                                $expenses = DB::table('expenses')
                                    ->whereMonth('created_at', $sale->month)
                                    ->whereYear('created_at', $sale->year)
                                    ->sum('amount');
                                $profit = $salesAmount - floatval($expenses);
                            }
                            
                            $monthData['profit'] = $profit;
                            break;
                        }
                    }
                }
            }

            // Remove internal fields before returning
            $formattedData = array_map(function($item) {
                unset($item['raw_month'], $item['raw_year']);
                return $item;
            }, $formattedData);

            return response()->json([
                'success' => true,
                'data' => $formattedData
            ]);

        } catch (\Exception $e) {
            // Error handling for trend data
            return response()->json([
                'success' => false,
                'message' => 'Error fetching sales trend data',
                'data' => [] // Return empty array on error
            ], 500);
        }
    }

    /**
     * Get expense breakdown data for pie/bar charts
     * Provides both estimated and actual expense categories
     * 
     * @param Request $request HTTP request object
     * @return \Illuminate\Http\JsonResponse JSON response with expense data
     */
    public function getExpenses(Request $request)
    {
        try {
            $expenseData = [];

            // Get base metrics for expense calculations
            $totalRevenue = 0;
            $totalEmployees = 0;
            $totalProducts = 0;

            // Fetch total revenue for expense estimations
            if (Schema::hasTable('sales')) {
                $totalRevenue = DB::table('sales')
                    ->when(Schema::hasColumn('sales', 'status'), function ($query) {
                        return $query->where('status', 'completed');
                    })
                    ->sum('total_amount');
            }

            // Get employee count for salary estimations
            if (Schema::hasTable('employees')) {
                $totalEmployees = DB::table('employees')
                    ->when(Schema::hasColumn('employees', 'is_active'), function ($query) {
                        return $query->where('is_active', true);
                    })
                    ->count();
            }

            // Get product count for inventory cost estimations
            if (Schema::hasTable('products')) {
                $totalProducts = DB::table('products')
                    ->when(Schema::hasColumn('products', 'is_active'), function ($query) {
                        return $query->where('is_active', true);
                    })
                    ->count();
            }

            // --- ESTIMATED EXPENSES (used when no actual data exists) ---
            if ($totalRevenue > 0) {
                // Cost of Goods Sold (65% of revenue - typical for retail)
                $cogs = $totalRevenue * 0.65;
                if ($cogs > 0) {
                    $expenseData[] = [
                        'name' => 'Product Costs',
                        'value' => floatval($cogs)
                    ];
                }

                // Employee costs ($2000 per employee per month estimate)
                if ($totalEmployees > 0) {
                    $employeeCosts = $totalEmployees * 2000;
                    $expenseData[] = [
                        'name' => 'Employee Costs',
                        'value' => floatval($employeeCosts)
                    ];
                }

                // Operational expenses (18% of revenue)
                $operationalCosts = $totalRevenue * 0.18;
                if ($operationalCosts > 0) {
                    $expenseData[] = [
                        'name' => 'Operational Expenses',
                        'value' => floatval($operationalCosts)
                    ];
                }

                // Payment processing fees (2.9% of revenue)
                $paymentFees = $totalRevenue * 0.029;
                if ($paymentFees > 0) {
                    $expenseData[] = [
                        'name' => 'Payment Processing',
                        'value' => floatval($paymentFees)
                    ];
                }
            }

            // --- ACTUAL EXPENSES (priority over estimates) ---
            // If actual expense data exists, use it instead of estimates
            if (Schema::hasTable('expenses')) {
                $actualExpenses = DB::table('expenses')
                    ->select('category', DB::raw('COALESCE(SUM(amount), 0) as total'))
                    ->where('amount', '>', 0)
                    ->groupBy('category')
                    ->get();

                foreach ($actualExpenses as $expense) {
                    if ($expense->total > 0) {
                        // Remove estimated categories when actual data exists
                        $expenseData = array_filter($expenseData, function($item) {
                            $estimatedCategories = ['Product Costs', 'Employee Costs', 
                                                   'Operational Expenses', 'Payment Processing'];
                            return !in_array($item['name'], $estimatedCategories);
                        });
                        
                        // Add actual expense category
                        $expenseData[] = [
                            'name' => $expense->category ?: 'Other Expenses',
                            'value' => floatval($expense->total)
                        ];
                    }
                }
            }

            // Return empty array if no expense data
            if (empty($expenseData)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Sort expenses by value (highest first)
            usort($expenseData, function($a, $b) {
                return $b['value'] - $a['value'];
            });

            return response()->json([
                'success' => true,
                'data' => $expenseData
            ]);

        } catch (\Exception $e) {
            // Error handling for expense data
            return response()->json([
                'success' => false,
                'data' => []
            ], 500);
        }
    }
}