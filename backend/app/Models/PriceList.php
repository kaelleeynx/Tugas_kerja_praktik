<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriceList extends Model
{
    use HasFactory;
    protected $fillable = [
        'product_id',
        'category',
        'product_name',
        'unit',
        'price',
        'stock',
    ];

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'price_list_id');
    }
}
