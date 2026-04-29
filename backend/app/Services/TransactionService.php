<?php

namespace App\Services;

use App\Models\Transaction;
use Carbon\Carbon;

/**
 * Transaction Service
 * Handles business logic for transaction statistics and reporting.
 * 
 * NOTE: Column mapping
 * - Transaction type values: 'penjualan' (sale), 'pengeluaran' (expense)
 * - Amount column: 'total' (not 'amount')
 * - Date column: 'date' (not 'created_at')
 */
class TransactionService
{
    /**
     * Get transaction statistics for a given date range.
     */
    public function getStatistics($startDate = null, $endDate = null)
    {
        $query = Transaction::query();

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        $result = $query->selectRaw("
            SUM(CASE WHEN type = 'penjualan' THEN total ELSE 0 END) as total_sales,
            SUM(CASE WHEN type = 'pengeluaran' THEN total ELSE 0 END) as total_expenses,
            COUNT(*) as transaction_count
        ")->first();

        $totalSales    = (float) ($result->total_sales ?? 0);
        $totalExpenses = (float) ($result->total_expenses ?? 0);

        return [
            'total_sales'       => $totalSales,
            'total_expenses'    => $totalExpenses,
            'net_profit'        => $totalSales - $totalExpenses,
            'transaction_count' => (int) ($result->transaction_count ?? 0),
        ];
    }

    /**
     * Get daily statistics grouped by transaction type.
     */
    public function getDailyStatistics($date = null)
    {
        $date = $date ? Carbon::parse($date) : Carbon::today();

        return Transaction::whereDate('date', $date)
            ->selectRaw('type, COUNT(*) as count, SUM(total) as total_amount')
            ->groupBy('type')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->type,
                    'count' => $item->count,
                    'total' => $item->total_amount,
                ];
            });
    }

    /**
     * Get monthly report grouped by date and type.
     * Uses whereBetween instead of whereMonth/whereYear to leverage the date index.
     */
    public function getMonthlyReport($month = null, $year = null)
    {
        $month = $month ?? Carbon::now()->month;
        $year  = $year  ?? Carbon::now()->year;

        // Build explicit date range so MySQL can use the idx_transactions_date_type index
        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
        $end   = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();

        return Transaction::whereBetween('date', [$start, $end])
            ->selectRaw('DATE(date) as report_date, type, SUM(total) as total_amount, COUNT(*) as count')
            ->groupByRaw('DATE(date), type')
            ->orderBy('report_date')
            ->get();
    }
}
