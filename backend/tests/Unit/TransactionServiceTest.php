<?php

namespace Tests\Unit;

use App\Models\PriceList;
use App\Models\Transaction;
use App\Models\User;
use App\Services\TransactionService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for TransactionService business logic.
 * Uses in-memory SQLite — no HTTP layer involved.
 */
class TransactionServiceTest extends TestCase
{
    use RefreshDatabase;

    private TransactionService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TransactionService();
        $this->user    = User::factory()->staff()->create();
    }

    // ─── getStatistics() ─────────────────────────────────────────────────

    /** @test */
    public function it_returns_zero_statistics_when_no_transactions(): void
    {
        $stats = $this->service->getStatistics();

        $this->assertEquals(0.0, $stats['total_sales']);
        $this->assertEquals(0.0, $stats['total_expenses']);
        $this->assertEquals(0.0, $stats['net_profit']);
        $this->assertEquals(0,   $stats['transaction_count']);
    }

    /** @test */
    public function it_calculates_total_sales_correctly(): void
    {
        $item = PriceList::factory()->create(['price' => 10000, 'stock' => 100]);

        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'quantity' => 3,
            'price'    => 10000,
            'total'    => 30000,
            'user_id'  => $this->user->id,
        ]);

        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'quantity' => 2,
            'price'    => 10000,
            'total'    => 20000,
            'user_id'  => $this->user->id,
        ]);

        $stats = $this->service->getStatistics();

        $this->assertEquals(50000.0, $stats['total_sales']);
        $this->assertEquals(0.0,     $stats['total_expenses']);
        $this->assertEquals(50000.0, $stats['net_profit']);
        $this->assertEquals(2,       $stats['transaction_count']);
    }

    /** @test */
    public function it_calculates_total_expenses_correctly(): void
    {
        $item = PriceList::factory()->create(['price' => 5000, 'stock' => 100]);

        Transaction::factory()->expense()->create([
            'price_list_id' => $item->id,
            'quantity' => 10,
            'price'    => 5000,
            'total'    => 50000,
            'user_id'  => $this->user->id,
        ]);

        $stats = $this->service->getStatistics();

        $this->assertEquals(0.0,     $stats['total_sales']);
        $this->assertEquals(50000.0, $stats['total_expenses']);
        $this->assertEquals(-50000.0, $stats['net_profit']);
    }

    /** @test */
    public function it_calculates_net_profit_as_sales_minus_expenses(): void
    {
        $item = PriceList::factory()->create(['stock' => 100]);

        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'total' => 100000,
            'user_id' => $this->user->id,
        ]);

        Transaction::factory()->expense()->create([
            'price_list_id' => $item->id,
            'total' => 40000,
            'user_id' => $this->user->id,
        ]);

        $stats = $this->service->getStatistics();

        $this->assertEquals(100000.0, $stats['total_sales']);
        $this->assertEquals(40000.0,  $stats['total_expenses']);
        $this->assertEquals(60000.0,  $stats['net_profit']);
    }

    /** @test */
    public function it_filters_statistics_by_date_range(): void
    {
        $item = PriceList::factory()->create(['stock' => 100]);

        // Transaction inside range
        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'date'  => '2024-01-15',
            'total' => 50000,
            'user_id' => $this->user->id,
        ]);

        // Transaction outside range
        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'date'  => '2024-03-01',
            'total' => 99999,
            'user_id' => $this->user->id,
        ]);

        $stats = $this->service->getStatistics('2024-01-01', '2024-01-31');

        $this->assertEquals(50000.0, $stats['total_sales']);
        $this->assertEquals(1,       $stats['transaction_count']);
    }

    /** @test */
    public function it_returns_all_transactions_when_no_date_filter(): void
    {
        $item = PriceList::factory()->create(['stock' => 100]);

        Transaction::factory()->count(5)->sale()->create([
            'price_list_id' => $item->id,
            'user_id' => $this->user->id,
        ]);

        $stats = $this->service->getStatistics();

        $this->assertEquals(5, $stats['transaction_count']);
    }

    // ─── getDailyStatistics() ─────────────────────────────────────────────

    /** @test */
    public function it_returns_empty_collection_for_day_with_no_transactions(): void
    {
        $stats = $this->service->getDailyStatistics('2024-01-01');

        $this->assertCount(0, $stats);
    }

    /** @test */
    public function it_groups_daily_statistics_by_type(): void
    {
        $item = PriceList::factory()->create(['stock' => 100]);
        $date = '2024-06-15';

        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'date'  => $date,
            'total' => 30000,
            'user_id' => $this->user->id,
        ]);

        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'date'  => $date,
            'total' => 20000,
            'user_id' => $this->user->id,
        ]);

        Transaction::factory()->expense()->create([
            'price_list_id' => $item->id,
            'date'  => $date,
            'total' => 15000,
            'user_id' => $this->user->id,
        ]);

        $stats = $this->service->getDailyStatistics($date);

        $this->assertCount(2, $stats); // penjualan + pengeluaran

        $salesStat = $stats->firstWhere('type', 'penjualan');
        $this->assertEquals(2,     $salesStat['count']);
        $this->assertEquals(50000, $salesStat['total']);

        $expenseStat = $stats->firstWhere('type', 'pengeluaran');
        $this->assertEquals(1,     $expenseStat['count']);
        $this->assertEquals(15000, $expenseStat['total']);
    }

    /** @test */
    public function it_defaults_to_today_when_no_date_given(): void
    {
        $item = PriceList::factory()->create(['stock' => 100]);

        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'date'    => Carbon::today()->toDateString(),
            'total'   => 10000,
            'user_id' => $this->user->id,
        ]);

        $stats = $this->service->getDailyStatistics();

        $this->assertCount(1, $stats);
        $this->assertEquals('penjualan', $stats->first()['type']);
    }

    // ─── getMonthlyReport() ───────────────────────────────────────────────

    /** @test */
    public function it_returns_empty_report_for_month_with_no_transactions(): void
    {
        $report = $this->service->getMonthlyReport(1, 2020);

        $this->assertCount(0, $report);
    }

    /** @test */
    public function it_groups_monthly_report_by_date_and_type(): void
    {
        $item = PriceList::factory()->create(['stock' => 100]);

        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'date'  => '2024-06-10',
            'total' => 25000,
            'user_id' => $this->user->id,
        ]);

        Transaction::factory()->expense()->create([
            'price_list_id' => $item->id,
            'date'  => '2024-06-10',
            'total' => 10000,
            'user_id' => $this->user->id,
        ]);

        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'date'  => '2024-06-20',
            'total' => 15000,
            'user_id' => $this->user->id,
        ]);

        $report = $this->service->getMonthlyReport(6, 2024);

        // 3 rows: 2024-06-10 penjualan, 2024-06-10 pengeluaran, 2024-06-20 penjualan
        $this->assertCount(3, $report);
    }

    /** @test */
    public function it_excludes_transactions_from_other_months(): void
    {
        $item = PriceList::factory()->create(['stock' => 100]);

        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'date'  => '2024-05-15', // May — should be excluded
            'total' => 99999,
            'user_id' => $this->user->id,
        ]);

        Transaction::factory()->sale()->create([
            'price_list_id' => $item->id,
            'date'  => '2024-06-15', // June — should be included
            'total' => 10000,
            'user_id' => $this->user->id,
        ]);

        $report = $this->service->getMonthlyReport(6, 2024);

        $this->assertCount(1, $report);
    }
}
