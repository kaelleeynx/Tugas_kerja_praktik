<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\PriceList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $transactions = Transaction::with(['user', 'priceList'])
            ->when($request->from && $request->to, function ($query) use ($request) {
                return $query->whereBetween('date', [$request->from, $request->to]);
            })
            ->orderBy('date', 'desc')
            ->get();

        // Mappings for old frontend compatibility (optional, better to change frontend)
        $transactions->transform(function ($transaction) {
            $transaction->product = $transaction->priceList ? $transaction->priceList->product_name : 'Item Dihapus';
            return $transaction;
        });

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:penjualan,pengeluaran',
            'date' => 'required|date',
            'price_list_id' => 'required|exists:price_lists,id',
            'quantity' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'note' => 'nullable|string|max:500'
        ]);

        try {
            $transaction = DB::transaction(function () use ($request) {
                // Lock the row for update to prevent race conditions
                $item = PriceList::where('id', $request->price_list_id)->lockForUpdate()->first();

                // Check stock availability for sales
                if ($request->type === 'penjualan') {
                    if ($item->stock < $request->quantity) {
                        throw new \Exception('Stok tidak mencukupi. Stok tersedia: ' . $item->stock);
                    }
                    $item->decrement('stock', $request->quantity);
                } else {
                    $item->increment('stock', $request->quantity);
                }

                // Generate unique transaction ID safely
                $transactionId = 'T-' . date('Ymd') . '-' . strtoupper(Str::random(6));

                return Transaction::create([
                    'id' => $transactionId,
                    'type' => $request->type,
                    'date' => $request->date,
                    'price_list_id' => $request->price_list_id,
                    'quantity' => $request->quantity,
                    'price' => $request->price,
                    'total' => $request->quantity * $request->price,
                    'note' => $request->note,
                    'user_id' => $request->user()->id
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil disimpan',
                'data' => $transaction
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function destroy($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $transaction = Transaction::findOrFail($id);

                if ($transaction->price_list_id) {
                    $item = PriceList::where('id', $transaction->price_list_id)->lockForUpdate()->first();
                    if ($item) {
                        if ($transaction->type === 'penjualan') {
                            $item->increment('stock', $transaction->quantity);
                        } else {
                            $item->decrement('stock', $transaction->quantity);
                        }
                    }
                }

                $transaction->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus transaksi: ' . $e->getMessage()
            ], 400);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        try {
            $transaction = DB::transaction(function () use ($request, $id) {
                $transaction = Transaction::findOrFail($id);
                $oldQty = $transaction->quantity;
                $diff = $request->quantity - $oldQty;

                if ($diff != 0 && $transaction->price_list_id) {
                    $item = PriceList::where('id', $transaction->price_list_id)->lockForUpdate()->first();
                    if ($item) {
                        if ($transaction->type === 'penjualan') {
                            if ($diff > 0 && $item->stock < $diff) {
                                throw new \Exception('Stok tidak mencukupi untuk update. Stok tersedia: ' . $item->stock);
                            }
                            $item->decrement('stock', $diff);
                        } else {
                            $item->increment('stock', $diff);
                        }
                    }
                }

                $transaction->quantity = $request->quantity;
                $transaction->total = $transaction->quantity * $transaction->price;
                $transaction->save();
                
                return $transaction;
            });

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil diperbarui',
                'data' => $transaction
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}