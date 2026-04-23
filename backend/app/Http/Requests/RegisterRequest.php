<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => 'required|string|min:3|max:50|unique:users|alpha_dash',
            'password' => 'required|string|min:6|max:100',
            'name'     => 'required|string|min:2|max:100',
            'role'     => 'sometimes|in:admin,staff',
        ];
    }

    public function messages(): array
    {
        return [
            'username.required'  => 'Username wajib diisi.',
            'username.unique'    => 'Username sudah terdaftar.',
            'username.min'       => 'Username minimal 3 karakter.',
            'username.alpha_dash'=> 'Username hanya boleh berisi huruf, angka, dash, dan underscore.',
            'password.required'  => 'Password wajib diisi.',
            'password.min'       => 'Password minimal 6 karakter.',
            'name.required'      => 'Nama lengkap wajib diisi.',
            'name.min'           => 'Nama minimal 2 karakter.',
            'role.in'            => 'Role harus admin atau staff.',
        ];
    }
}
