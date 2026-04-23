<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'username'        => $this->username,
            'name'            => $this->name,
            'role'            => $this->role,
            'is_approved'     => $this->is_approved,
            'profile_picture' => $this->profile_picture
                ? url('storage/' . $this->profile_picture)
                : null,
            'last_login_at'   => $this->last_login_at?->toISOString(),
            'created_at'      => $this->created_at?->toISOString(),
        ];
    }
}
