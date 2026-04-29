<?php

namespace Tests\Feature;

use App\Models\PriceList;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Transaction endpoints:
 * GET    /api/transactions
 * POST   /api/transactions
 * PUT    /api/transactions/{id}
 * DELETE /api/transactions/{id}
 */
class TransactionTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $staff;
    private PriceList $item;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->owner()->create();
        $this->staff = User::factory()->staff()->create();
        $this->item  = PriceList::factory()->create(['price' => 10000, 'stock' => 100]);
    }

    // ─── GET /api/transactions ────────────────────────────────────────────

    /** @test */
    public function authenticated_user_can_list_transactions(): void
    {
        Transaction::factory()->count(3)->create([
            'price_list_id' => $this->item->id,
            'user_id'       => $this->staff->id,
        ]);

        $response = $this->actingAs($this->staff)->getJson('/api/transactions');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data', 'meta']);
    }

    /** @test */
    public function unauthenticated_user_cannot_list_transactions(): void
    {
        $response = $this->getJson('/api/transactions');

        $response->assertStatus(401);
    }

    /** @test */
    public function transactions_are_paginated(): void
    {
        Transaction::factory()->count(5)->create([
            'price_list_id' => $this->item->id,
            'user_id'       => $this->staff->id,
        ]);

        $response = $this->actingAs($this->staff)->getJson('/api/transactions?per_page=2');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 5);
    }

    // ─── POST /api/transactions ───────────────────────────────────────────

    /** @test */
    public function staff_can_create_sale_transaction_and_stock_decrements(): void
    {
        $response = $this->actingAs($this->staff)->postJson('/api/transactions', [
            'type'          => 'penjualan',
            'date'          => now()->toDateString(),
            'price_list_id' => $this->item->id,
            'quantity'      => 5,
            'price'         => 10000,
            'note'          => 'Test sale',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.type', 'penjualan');

        // Stock should decrease by 5
        $this->assertEquals(95, $this->item->fresh()->stock);
    }

    /** @test */
    public function staff_can_create_expense_transaction_and_stock_increments(): void
    {
        $response = $this->actingAs($this->staff)->postJson('/api/transactions', [
            'type'          => 'pengeluaran',
            'date'          => now()->toDateString(),
            'price_list_id' => $this->item->id,
            'quantity'      => 10,
            'price'         => 8000,
            'note'          => 'Restock',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        // Stock should increase by 10
        $this->assertEquals(110, $this->item->fresh()->stock);
    }

    /** @test */
    public function sale_fails_when_stock_is_insufficient(): void
    {
        $lowStockItem = PriceList::factory()->create(['stock' => 3, 'price' => 5000]);

        $response = $this->actingAs($this->staff)->postJson('/api/transactions', [
            'type'          => 'penjualan',
            'date'          => now()->toDateString(),
            'price_list_id' => $lowStockItem->id,
            'quantity'      => 10, // more than stock
            'price'         => 5000,
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('success', false);

        // Stock should remain unchanged
        $this->assertEquals(3, $lowStockItem->fresh()->stock);
    }

    /** @test */
    public function transaction_total_is_calculated_as_quantity_times_price(): void
    {
        $response = $this->actingAs($this->staff)->postJson('/api/transactions', [
            'type'          => 'penjualan',
            'date'          => now()->toDateString(),
            'price_list_id' => $this->item->id,
            'quantity'      => 4,
            'price'         => 10000,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.total', 40000);
    }

    /** @test */
    public function transaction_requires_valid_fields(): void
    {
        $response = $this->actingAs($this->staff)->postJson('/api/transactions', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'date', 'price_list_id', 'quantity', 'price']);
    }

    // ─── PUT /api/transactions/{id} ───────────────────────────────────────

    /** @test */
    public function owner_can_update_transaction_quantity(): void
    {
        $transaction = Transaction::factory()->sale()->create([
            'price_list_id' => $this->item->id,
            'quantity'      => 5,
            'price'         => 10000,
            'total'         => 50000,
            'user_id'       => $this->staff->id,
        ]);

        // Adjust stock to reflect existing transaction
        $this->item->decrement('stock', 5);

        $response = $this->actingAs($this->owner)->putJson("/api/transactions/{$transaction->id}", [
            'quantity' => 8,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.quantity', 8);
    }

    /** @test */
    public function staff_cannot_update_another_users_transaction(): void
    {
        $otherStaff  = User::factory()->staff()->create();
        $transaction = Transaction::factory()->sale()->create([
            'price_list_id' => $this->item->id,
            'quantity'      => 3,
            'price'         => 10000,
            'total'         => 30000,
            'user_id'       => $otherStaff->id,
        ]);

        $response = $this->actingAs($this->staff)->putJson("/api/transactions/{$transaction->id}", [
            'quantity' => 5,
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('success', false);
    }

    // ─── DELETE /api/transactions/{id} ────────────────────────────────────

    /** @test */
    public function owner_can_delete_transaction_and_stock_is_restored(): void
    {
        $transaction = Transaction::factory()->sale()->create([
            'price_list_id' => $this->item->id,
            'quantity'      => 5,
            'price'         => 10000,
            'total'         => 50000,
            'user_id'       => $this->staff->id,
        ]);

        $this->item->decrement('stock', 5); // simulate stock after sale

        $response = $this->actingAs($this->owner)->deleteJson("/api/transactions/{$transaction->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Stock should be restored
        $this->assertEquals(100, $this->item->fresh()->stock);
        $this->assertDatabaseMissing('transactions', ['id' => $transaction->id]);
    }

    /** @test */
    public function staff_cannot_delete_another_users_transaction(): void
    {
        $otherStaff  = User::factory()->staff()->create();
        $transaction = Transaction::factory()->sale()->create([
            'price_list_id' => $this->item->id,
            'quantity'      => 2,
            'price'         => 10000,
            'total'         => 20000,
            'user_id'       => $otherStaff->id,
        ]);

        $response = $this->actingAs($this->staff)->deleteJson("/api/transactions/{$transaction->id}");

        $response->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('transactions', ['id' => $transaction->id]);
    }

    /** @test */
    public function deleting_nonexistent_transaction_returns_404(): void
    {
        $response = $this->actingAs($this->owner)->deleteJson('/api/transactions/NONEXISTENT-ID');

        $response->assertStatus(400); // caught by exception handler
    }
}
