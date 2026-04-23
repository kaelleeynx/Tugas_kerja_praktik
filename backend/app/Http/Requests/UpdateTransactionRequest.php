<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity' => 'required|integer|min:1|max:99999',
        ];
    }

    public function messages(): array
    {
        return [
            'quantity.required' => 'Jumlah wajib diisi.',
            'quantity.min'      => 'Jumlah minimal 1.',
            'quantity.max'      => 'Jumlah maksimal 99999.',
        ];
    }
}
