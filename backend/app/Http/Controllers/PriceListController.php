<?php

namespace App\Http\Controllers;

use App\Models\PriceList;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PriceListController extends Controller
{
    public function index()
    {
        $items = PriceList::all();

        // Optimized & Safe: Aggregate by price_list_id using database group
        $sales = Transaction::selectRaw('price_list_id, SUM(quantity) as total_qty')
            ->where('type', 'penjualan')
            ->groupBy('price_list_id')
            ->pluck('total_qty', 'price_list_id');

        $purchases = Transaction::selectRaw('price_list_id, SUM(quantity) as total_qty')
            ->where('type', 'pengeluaran')
            ->groupBy('price_list_id')
            ->pluck('total_qty', 'price_list_id');

        $items->transform(function ($item) use ($sales, $purchases) {
            $item->qty_sales = $sales[$item->id] ?? 0;
            $item->qty_purchases = $purchases[$item->id] ?? 0;
            return $item;
        });

        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'product_name' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:100',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
        ]);

        $item = PriceList::findOrFail($id);
        $item->update($request->only(['product_name', 'category', 'price', 'stock']));

        return response()->json([
            'success' => true,
            'message' => 'Item berhasil diperbarui',
            'data' => $item
        ]);
    }

    public function sale(Request $request, $id)
    {
        try {
            DB::transaction(function () use ($request, $id, &$item) {
                $item = PriceList::lockForUpdate()->findOrFail($id);
                $quantity = $request->input('quantity', 1);

                if ($item->stock < $quantity) {
                    throw new \Exception('Insufficient stock');
                }

                $item->decrement('stock', $quantity);

                // Create transaction
                $total = $quantity * $item->price;
                $transactionId = 'T-' . date('Ymd') . '-' . strtoupper(Str::random(6));

                Transaction::create([
                    'id' => $transactionId,
                    'type' => 'penjualan',
                    'date' => now()->toDateString(),
                    'price_list_id' => $item->id,
                    'quantity' => $quantity,
                    'price' => $item->price,
                    'total' => $total,
                    'note' => 'Auto dari daftar barang',
                    'user_id' => $request->user()->id
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Penjualan berhasil disimpan',
                'data' => $item->refresh()
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function restock(Request $request, $id)
    {
        try {
            DB::transaction(function () use ($request, $id, &$item) {
                $item = PriceList::lockForUpdate()->findOrFail($id);
                $quantity = $request->input('quantity', 1);

                $item->increment('stock', $quantity);

                // Create transaction
                $total = $quantity * $item->price;
                $transactionId = 'T-' . date('Ymd') . '-' . strtoupper(Str::random(6));

                Transaction::create([
                    'id' => $transactionId,
                    'type' => 'pengeluaran',
                    'date' => now()->toDateString(),
                    'price_list_id' => $item->id,
                    'quantity' => $quantity,
                    'price' => $item->price,
                    'total' => $total,
                    'note' => 'Auto restock dari daftar barang',
                    'user_id' => $request->user()->id
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Restock berhasil disimpan',
                'data' => $item->refresh()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
