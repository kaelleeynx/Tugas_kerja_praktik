<?php

namespace Tests\Unit;

use App\Models\PriceList;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for PriceList model — attributes, relationships, factory states.
 */
class PriceListModelTest extends TestCase
{
    use RefreshDatabase;

    // ─── Factory States ───────────────────────────────────────────────────

    /** @test */
    public function it_creates_price_list_with_required_fields(): void
    {
        $item = PriceList::factory()->create([
            'product_name' => 'Besi Hollow',
            'category'     => 'Besi',
            'price'        => 25000,
            'stock'        => 50,
        ]);

        $this->assertEquals('Besi Hollow', $item->product_name);
        $this->assertEquals('Besi',        $item->category);
        $this->assertEquals(25000,         $item->price);
        $this->assertEquals(50,            $item->stock);
    }

    /** @test */
    public function low_stock_factory_state_creates_item_with_stock_of_2(): void
    {
        $item = PriceList::factory()->lowStock()->create();

        $this->assertEquals(2, $item->stock);
    }

    /** @test */
    public function out_of_stock_factory_state_creates_item_with_zero_stock(): void
    {
        $item = PriceList::factory()->outOfStock()->create();

        $this->assertEquals(0, $item->stock);
    }

    // ─── Relationships ────────────────────────────────────────────────────

    /** @test */
    public function it_has_many_transactions(): void
    {
        $item = PriceList::factory()->create(['stock' => 100]);
        $user = User::factory()->staff()->create();

        Transaction::factory()->count(4)->create([
            'price_list_id' => $item->id,
            'user_id'       => $user->id,
        ]);

        $this->assertCount(4, $item->transactions);
        $this->assertInstanceOf(Transaction::class, $item->transactions->first());
    }

    /** @test */
    public function it_returns_empty_collection_when_no_transactions(): void
    {
        $item = PriceList::factory()->create();

        $this->assertCount(0, $item->transactions);
    }

    // ─── Stock Operations ─────────────────────────────────────────────────

    /** @test */
    public function it_can_decrement_stock(): void
    {
        $item = PriceList::factory()->create(['stock' => 20]);

        $item->decrement('stock', 5);

        $this->assertEquals(15, $item->fresh()->stock);
    }

    /** @test */
    public function it_can_increment_stock(): void
    {
        $item = PriceList::factory()->create(['stock' => 10]);

        $item->increment('stock', 8);

        $this->assertEquals(18, $item->fresh()->stock);
    }

    /** @test */
    public function it_has_transactions_returns_true_when_transactions_exist(): void
    {
        $item = PriceList::factory()->create(['stock' => 100]);
        $user = User::factory()->staff()->create();

        Transaction::factory()->create([
            'price_list_id' => $item->id,
            'user_id'       => $user->id,
        ]);

        $this->assertTrue($item->transactions()->exists());
    }

    /** @test */
    public function it_has_transactions_returns_false_when_no_transactions(): void
    {
        $item = PriceList::factory()->create();

        $this->assertFalse($item->transactions()->exists());
    }
}
