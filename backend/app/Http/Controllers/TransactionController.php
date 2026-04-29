<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\PriceList;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

use App\Services\TransactionService;

class TransactionController extends Controller
{
    // Q1: Dependency injection via constructor — tidak perlu new() di setiap method
    public function __construct(
        private readonly TransactionService $transactionService
    ) {}

    public function index(Request $request)
    {
        $perPage = min((int) ($request->per_page ?? 50), 200);

        $transactions = Transaction::with(['user', 'priceList'])
            ->when($request->from && $request->to, function ($query) use ($request) {
                return $query->whereBetween('date', [$request->from, $request->to]);
            })
            ->orderBy('date', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => TransactionResource::collection($transactions),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page'    => $transactions->lastPage(),
                'per_page'     => $transactions->perPage(),
                'total'        => $transactions->total(),
            ],
        ]);
    }

    public function store(StoreTransactionRequest $request)
    {
        try {
            $transaction = DB::transaction(function () use ($request) {
                // Lock the row for update to prevent race conditions
                $item = PriceList::where('id', $request->price_list_id)->lockForUpdate()->first();

                // FIX E1: Handle item not found gracefully
                if (!$item) {
                    throw new \Exception('Produk tidak ditemukan.');
                }

                // Check stock availability for sales
                if ($request->type === 'penjualan') {
                    if ($item->stock < $request->quantity) {
                        throw new \Exception('Stok tidak mencukupi. Stok tersedia: ' . $item->stock);
                    }
                    $item->decrement('stock', $request->quantity);
                } else {
                    $item->increment('stock', $request->quantity);
                }

                // Generate unique transaction ID
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
                'data' => new TransactionResource($transaction->load('priceList'))
            ], 201);
            
        } catch (\Exception $e) {
            // FIX L3: Log error ke server
            Log::error('Transaction store failed', [
                'user_id' => $request->user()->id,
                'error'   => $e->getMessage(),
                'data'    => $request->only(['type', 'price_list_id', 'quantity', 'date']),
            ]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function show($id)
    {
        $transaction = Transaction::with(['user', 'priceList'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new TransactionResource($transaction)
        ]);
    }

    public function destroy($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $transaction = Transaction::findOrFail($id);

                // Only owner or the transaction creator can delete
                $user = request()->user();
                if ($user->role !== 'owner' && $transaction->user_id !== $user->id) {
                    throw new \Exception('Anda tidak memiliki izin untuk menghapus transaksi ini.');
                }

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

    public function update(UpdateTransactionRequest $request, $id)
    {
        try {
            $transaction = DB::transaction(function () use ($request, $id) {
                $transaction = Transaction::findOrFail($id);

                // Only owner or the transaction creator can update
                $user = $request->user();
                if ($user->role !== 'owner' && $transaction->user_id !== $user->id) {
                    throw new \Exception('Anda tidak memiliki izin untuk mengubah transaksi ini.');
                }

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
                'data' => new TransactionResource($transaction->load('priceList'))
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function getStatistics(Request $request)
    {
        $stats = $this->transactionService->getStatistics($request->from, $request->to);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    public function getDailyStatistics(Request $request)
    {
        $stats = $this->transactionService->getDailyStatistics($request->date);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    public function dashboardSummary()
    {
        $currentMonth = $this->transactionService->getStatistics(
            now()->startOfMonth()->toDateString(),
            now()->endOfMonth()->toDateString()
        );

        $prevMonth = $this->transactionService->getStatistics(
            now()->subMonth()->startOfMonth()->toDateString(),
            now()->subMonth()->endOfMonth()->toDateString()
        );

        $today = $this->transactionService->getDailyStatistics(now());

        return response()->json([
            'success' => true,
            'data' => [
                'current_month'  => $currentMonth,
                'previous_month' => $prevMonth,
                'today'          => $today,
                'total_products' => \App\Models\PriceList::count(),
                'total_users'    => \App\Models\User::where('role', '!=', 'owner')->count(),
            ]
        ]);
    }

    public function monthlyReport(Request $request)
    {
        $report = $this->transactionService->getMonthlyReport($request->month, $request->year);

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    public function export(Request $request)
    {
        // FIX D2: Tambah limit dan validasi date range untuk mencegah OOM
        $request->validate([
            'from' => 'nullable|date',
            'to'   => 'nullable|date|after_or_equal:from',
        ]);

        $transactions = Transaction::with(['user', 'priceList'])
            ->when($request->from && $request->to, function ($query) use ($request) {
                return $query->whereBetween('date', [$request->from, $request->to]);
            })
            ->orderBy('date', 'desc')
            ->limit(10000) // Safety limit — max 10k rows per export
            ->get();

        return response()->json([
            'success' => true,
            'data' => TransactionResource::collection($transactions),
            'meta' => [
                'total' => $transactions->count(),
                'note'  => $transactions->count() >= 10000
                    ? 'Data dibatasi 10.000 baris. Gunakan filter tanggal untuk export lebih spesifik.'
                    : null,
            ],
        ]);
    }
}