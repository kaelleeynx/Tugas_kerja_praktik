<?php

namespace App\Http\Controllers;

use App\Models\PriceList;
use App\Models\Transaction;
use App\Http\Requests\UpdatePriceListRequest;
use App\Http\Resources\PriceListResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PriceListController extends Controller
{
    public function index()
    {
        $items = PriceList::all();

        // Aggregate sales/purchases counts efficiently via DB
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
            'data' => PriceListResource::collection($items)
        ]);
    }

    public function show($id)
    {
        $item = PriceList::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new PriceListResource($item)
        ]);
    }

    public function update(UpdatePriceListRequest $request, $id)
    {
        $item = PriceList::findOrFail($id);
        $item->update($request->only(['product_name', 'category', 'price', 'stock']));

        return response()->json([
            'success' => true,
            'message' => 'Item berhasil diperbarui',
            'data' => new PriceListResource($item)
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string|max:255',
            'category'     => 'required|string|max:100',
            'price'        => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
        ]);

        $item = PriceList::create([
            'product_id'   => strtoupper(Str::random(8)),
            'product_name' => $request->product_name,
            'category'     => $request->category,
            'price'        => $request->price,
            'stock'        => $request->stock,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Item berhasil ditambahkan',
            'data' => new PriceListResource($item)
        ], 201);
    }

    public function destroy($id)
    {
        $item = PriceList::findOrFail($id);

        // Check if item has transactions
        if ($item->transactions()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus item yang memiliki transaksi'
            ], 400);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item berhasil dihapus'
        ]);
    }

    public function sale(Request $request, $id)
    {
        try {
            $item = null;
            DB::transaction(function () use ($request, $id, &$item) {
                $item = PriceList::lockForUpdate()->findOrFail($id);
                $quantity = $request->input('quantity', 1);

                if ($item->stock < $quantity) {
                    throw new \Exception('Stok tidak mencukupi. Stok tersedia: ' . $item->stock);
                }

                $item->decrement('stock', $quantity);

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
                'data' => new PriceListResource($item->refresh())
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function restock(Request $request, $id)
    {
        try {
            $item = null;
            DB::transaction(function () use ($request, $id, &$item) {
                $item = PriceList::lockForUpdate()->findOrFail($id);
                $quantity = $request->input('quantity', 1);

                $item->increment('stock', $quantity);

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
                'data' => new PriceListResource($item->refresh())
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
