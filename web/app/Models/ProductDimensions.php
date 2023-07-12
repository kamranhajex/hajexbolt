<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductDimensions extends Model
{
    use HasFactory;

    protected $table='products_dimensions';  
    protected $fillable=[
      'id', 'shopify_shop', 'product_id', 'variation_id', 'packing_type', '_width', '_height', '_length', '_weight'
    ];

}
