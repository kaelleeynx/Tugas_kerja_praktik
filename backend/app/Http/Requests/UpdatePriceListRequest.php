<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_name' => 'sometimes|string|max:255',
            'category'     => 'sometimes|string|max:100',
            'price'        => 'sometimes|numeric|min:0|max:999999999',
            'stock'        => 'sometimes|integer|min:0|max:999999',
        ];
    }

    public function messages(): array
    {
        return [
            'product_name.max' => 'Nama produk maksimal 255 karakter.',
            'category.max'     => 'Kategori maksimal 100 karakter.',
            'price.min'        => 'Harga tidak boleh negatif.',
            'stock.min'        => 'Stok tidak boleh negatif.',
        ];
    }
}
