<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateShopifyUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
      Schema::dropIfExists('shopifyUsers');
      Schema::create('shopifyUsers', function (Blueprint $table) {
        $table->id();
        $table->string('shopify_shop')->nullable();
        $table->string('shopify_token')->nullable();
        $table->string('api_token')->nullable();
        $table->string('full_address')->nullable();
        $table->string('country')->nullable();
        $table->string('state')->nullable();
        $table->string('city')->nullable();
        $table->string('zipcode')->nullable();
        $table->string('company')->nullable();
        $table->string('attention')->nullable();
        $table->string('phone')->nullable();
        $table->string('email')->nullable();
        $table->timestamps();
      });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('shopifyUsers');
    }
}
