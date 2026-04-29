<?php

namespace Tests\Feature;

use App\Models\PriceList;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for PriceList endpoints:
 * GET    /api/price-list
 * POST   /api/price-list
 * PUT    /api/price-list/{id}
 * DELETE /api/price-list/{id}
 * POST   /api/price-list/{id}/sale
 * POST   /api/price-list/{id}/restock
 */
class PriceListTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->owner()->create();
        $this->staff = User::factory()->staff()->create();
    }

    // ─── GET /api/price-list ──────────────────────────────────────────────

    /** @test */
    public function authenticated_user_can_list_price_list_items(): void
    {
        PriceList::factory()->count(5)->create();

        $response = $this->actingAs($this->staff)->getJson('/api/price-list');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(5, 'data');
    }

    /** @test */
    public function unauthenticated_user_cannot_list_price_list(): void
    {
        $response = $this->getJson('/api/price-list');

        $response->assertStatus(401);
    }

    // ─── POST /api/price-list ─────────────────────────────────────────────

    /** @test */
    public function owner_can_create_price_list_item(): void
    {
        $response = $this->actingAs($this->owner)->postJson('/api/price-list', [
            'product_name' => 'Besi Hollow 4x4',
            'category'     => 'Besi',
            'price'        => 35000,
            'stock'        => 50,
            'unit'         => 'batang',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.product_name', 'Besi Hollow 4x4')
            ->assertJsonPath('data.stock', 50);

        $this->assertDatabaseHas('price_lists', ['product_name' => 'Besi Hollow 4x4']);
    }

    /** @test */
    public function create_item_fails_with_missing_required_fields(): void
    {
        $response = $this->actingAs($this->owner)->postJson('/api/price-list', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['product_name', 'category', 'price', 'stock']);
    }

    // ─── PUT /api/price-list/{id} ─────────────────────────────────────────

    /** @test */
    public function owner_can_update_price_list_item(): void
    {
        $item = PriceList::factory()->create(['price' => 10000, 'stock' => 20]);

        $response = $this->actingAs($this->owner)->putJson("/api/price-list/{$item->id}", [
            'product_name' => 'Updated Name',
            'category'     => 'Pipa',
            'price'        => 15000,
            'stock'        => 30,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.price', 15000)
            ->assertJsonPath('data.stock', 30);
    }

    /** @test */
    public function update_nonexistent_item_returns_404(): void
    {
        $response = $this->actingAs($this->owner)->putJson('/api/price-list/99999', [
            'product_name' => 'Ghost',
            'category'     => 'X',
            'price'        => 1000,
            'stock'        => 1,
        ]);

        $response->assertStatus(404);
    }

    // ─── DELETE /api/price-list/{id} ──────────────────────────────────────

    /** @test */
    public function owner_can_delete_item_with_no_transactions(): void
    {
        $item = PriceList::factory()->create();

        $response = $this->actingAs($this->owner)->deleteJson("/api/price-list/{$item->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('price_lists', ['id' => $item->id]);
    }

    /** @test */
    public function cannot_delete_item_that_has_transactions(): void
    {
        $item = PriceList::factory()->create(['stock' => 100]);

        Transaction::factory()->create([
            'price_list_id' => $item->id,
            'user_id'       => $this->staff->id,
        ]);

        $response = $this->actingAs($this->owner)->deleteJson("/api/price-list/{$item->id}");

        $response->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('price_lists', ['id' => $item->id]);
    }

    // ─── POST /api/price-list/{id}/sale ──────────────────────────────────

    /** @test */
    public function sale_decrements_stock_and_creates_transaction(): void
    {
        $item = PriceList::factory()->create(['price' => 20000, 'stock' => 30]);

        $response = $this->actingAs($this->staff)->postJson("/api/price-list/{$item->id}/sale", [
            'quantity' => 5,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals(25, $item->fresh()->stock);

        $this->assertDatabaseHas('transactions', [
            'price_list_id' => $item->id,
            'type'          => 'penjualan',
            'quantity'      => 5,
        ]);
    }

    /** @test */
    public function sale_fails_when_stock_is_insufficient(): void
    {
        $item = PriceList::factory()->outOfStock()->create(['price' => 5000]);

        $response = $this->actingAs($this->staff)->postJson("/api/price-list/{$item->id}/sale", [
            'quantity' => 1,
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertEquals(0, $item->fresh()->stock);
    }

    /** @test */
    public function sale_defaults_to_quantity_1_when_not_specified(): void
    {
        $item = PriceList::factory()->create(['price' => 10000, 'stock' => 10]);

        $response = $this->actingAs($this->staff)->postJson("/api/price-list/{$item->id}/sale", []);

        $response->assertStatus(200);
        $this->assertEquals(9, $item->fresh()->stock);
    }

    // ─── POST /api/price-list/{id}/restock ───────────────────────────────

    /** @test */
    public function restock_increments_stock_and_creates_transaction(): void
    {
        $item = PriceList::factory()->create(['price' => 8000, 'stock' => 10]);

        $response = $this->actingAs($this->staff)->postJson("/api/price-list/{$item->id}/restock", [
            'quantity' => 20,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals(30, $item->fresh()->stock);

        $this->assertDatabaseHas('transactions', [
            'price_list_id' => $item->id,
            'type'          => 'pengeluaran',
            'quantity'      => 20,
        ]);
    }

    /** @test */
    public function restock_defaults_to_quantity_1_when_not_specified(): void
    {
        $item = PriceList::factory()->create(['price' => 5000, 'stock' => 5]);

        $response = $this->actingAs($this->staff)->postJson("/api/price-list/{$item->id}/restock", []);

        $response->assertStatus(200);
        $this->assertEquals(6, $item->fresh()->stock);
    }
}
