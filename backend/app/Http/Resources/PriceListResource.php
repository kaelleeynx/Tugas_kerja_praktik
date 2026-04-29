<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PriceListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'product_id'    => $this->product_id,
            'product_name'  => $this->product_name,
            'category'      => $this->category,
            'unit'          => $this->unit,
            'price'         => $this->price,
            'stock'         => $this->stock,
            'qty_sales'     => $this->qty_sales ?? 0,
            'qty_purchases' => $this->qty_purchases ?? 0,
            'created_at'    => $this->created_at?->toISOString(),
            'updated_at'    => $this->updated_at?->toISOString(),
        ];
    }
}
