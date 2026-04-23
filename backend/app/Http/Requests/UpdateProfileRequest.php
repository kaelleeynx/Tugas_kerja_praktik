<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => 'required|string|min:2|max:100',
            'password'        => 'nullable|string|min:6|max:100',
            'profile_picture' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'          => 'Nama wajib diisi.',
            'name.min'               => 'Nama minimal 2 karakter.',
            'password.min'           => 'Password minimal 6 karakter.',
            'profile_picture.image'  => 'File harus berupa gambar.',
            'profile_picture.mimes'  => 'Format gambar harus JPEG, PNG, atau WebP.',
            'profile_picture.max'    => 'Ukuran gambar maksimal 2MB.',
        ];
    }
}
