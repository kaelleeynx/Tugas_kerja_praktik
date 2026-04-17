<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'type',
        'date',
        'price_list_id',
        'quantity',
        'price',
        'total',
        'note',
        'user_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function priceList()
    {
        return $this->belongsTo(PriceList::class, 'price_list_id');
    }
}