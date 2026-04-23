<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'type'          => $this->type,
            'date'          => $this->date,
            'product'       => $this->whenLoaded('priceList', fn() => $this->priceList->product_name, 'Item Dihapus'),
            'price_list_id' => $this->price_list_id,
            'quantity'      => $this->quantity,
            'price'         => $this->price,
            'total'         => $this->total,
            'note'          => $this->note,
            'user_id'       => $this->user_id,
            'user'          => new UserResource($this->whenLoaded('user')),
            'created_at'    => $this->created_at?->toISOString(),
        ];
    }
}
