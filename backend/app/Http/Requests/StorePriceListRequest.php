<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FIX A5: Pindahkan validasi dari inline PriceListController::store()
 * ke FormRequest yang konsisten dengan controller lain.
 */
class StorePriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_name' => 'required|string|max:255',
            'category'     => 'required|string|max:100',
            'price'        => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'unit'         => 'nullable|string|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            'product_name.required' => 'Nama produk wajib diisi.',
            'product_name.max'      => 'Nama produk maksimal 255 karakter.',
            'category.required'     => 'Kategori wajib diisi.',
            'price.required'        => 'Harga wajib diisi.',
            'price.numeric'         => 'Harga harus berupa angka.',
            'price.min'             => 'Harga tidak boleh negatif.',
            'stock.required'        => 'Stok wajib diisi.',
            'stock.integer'         => 'Stok harus berupa bilangan bulat.',
            'stock.min'             => 'Stok tidak boleh negatif.',
        ];
    }
}
