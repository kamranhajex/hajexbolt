<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopifyUsers extends Model
{
    use HasFactory;

    protected $table='shopifyUsers';  
    protected $fillable=[
      'id', 'shopify_shop', 'shopify_auth_code', 'shopify_access_token', 'hajexbolt_token', 'full_address', 'country', 
      'country_code', 'state', 'state_code', 'city', 'zipcode', 'company', 'attention', 'phone', 'email', 'is_connect', 'created_at', 'updated_at','hajexbolt_response'
    ]; 
     


}
