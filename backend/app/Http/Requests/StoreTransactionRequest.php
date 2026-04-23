<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'          => 'required|in:penjualan,pengeluaran',
            'date'          => 'required|date|before_or_equal:today',
            'price_list_id' => 'required|exists:price_lists,id',
            'quantity'      => 'required|integer|min:1|max:99999',
            'price'         => 'required|numeric|min:0|max:999999999',
            'note'          => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required'          => 'Jenis transaksi wajib diisi.',
            'type.in'                => 'Jenis transaksi harus penjualan atau pengeluaran.',
            'date.required'          => 'Tanggal wajib diisi.',
            'date.before_or_equal'   => 'Tanggal tidak boleh di masa depan.',
            'price_list_id.required' => 'Produk wajib dipilih.',
            'price_list_id.exists'   => 'Produk tidak ditemukan.',
            'quantity.required'      => 'Jumlah wajib diisi.',
            'quantity.min'           => 'Jumlah minimal 1.',
            'price.required'         => 'Harga wajib diisi.',
            'price.min'              => 'Harga tidak boleh negatif.',
            'note.max'               => 'Catatan maksimal 500 karakter.',
        ];
    }
}
