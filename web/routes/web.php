<?php
use App\Exceptions\ShopifyProductCreatorException;
use App\Lib\AuthRedirection;
use App\Lib\EnsureBilling;
use App\Lib\ProductCreator;
use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Shopify\Auth\OAuth;
use Shopify\Auth\Session as AuthSession;
use Shopify\Clients\HttpHeaders;
use Shopify\Clients\Rest;
use Shopify\Context;
use Shopify\Exception\InvalidWebhookException;
use Shopify\Utils;
use Shopify\Webhooks\Registry;
use Shopify\Webhooks\Topics;

use Illuminate\Support\Facades\Http;

/*
 | ------------------------------------------------------------------------
 | Models
 | ------------------------------------------------------------------------
 | Include all the models required for shopify app
 */
use App\Models\ShopifyUsers;
use App\Models\ProductDimensions;
use App\Models\Countries;
use App\Models\States;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
| If you are adding routes outside of the /api path, remember to also add a
| proxy rule for them in web/frontend/vite.config.js
|
*/

Route::fallback(function (Request $request) {
    if (Context::$IS_EMBEDDED_APP &&  $request->query("embedded", false) === "1") {
        if (env('APP_ENV') === 'production') {
            return file_get_contents(public_path('index.html'));
        } else {
            return file_get_contents(base_path('frontend/index.html'));
        }
    } else {
        return redirect(Utils::getEmbeddedAppUrl($request->query("host", null)) . "/" . $request->path());
    }
})->middleware('shopify.installed');

Route::get('/api/auth', function (Request $request) {
    $shop = Utils::sanitizeShopDomain($request->query('shop'));

    // Delete any previously created OAuth sessions that were not completed (don't have an access token)
    Session::where('shop', $shop)->where('access_token', null)->delete();

    return AuthRedirection::redirect($request);
});

Route::get('/api/auth/callback', function (Request $request) {
    $session = OAuth::callback(
        $request->cookie(),
        $request->query(),
        ['App\Lib\CookieHandler', 'saveShopifyCookie'],
    );

    $host = $request->query('host');
    $shop = Utils::sanitizeShopDomain($request->query('shop'));

    $response = Registry::register('/api/webhooks', Topics::APP_UNINSTALLED, $shop, $session->getAccessToken());
    if ($response->isSuccess()) {
        Log::debug("Registered APP_UNINSTALLED webhook for shop $shop");
    } else {
        Log::error(
            "Failed to register APP_UNINSTALLED webhook for shop $shop with response body: " .
                print_r($response->getBody(), true)
        );
    }

    $redirectUrl = Utils::getEmbeddedAppUrl($host);
    if (Config::get('shopify.billing.required')) {
        list($hasPayment, $confirmationUrl) = EnsureBilling::check($session, Config::get('shopify.billing'));

        if (!$hasPayment) {
            $redirectUrl = $confirmationUrl;
        }
    }

    return redirect($redirectUrl);
});

Route::get('/api/products/count', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $client = new Rest($session->getShop(), $session->getAccessToken());
    $result = $client->get('products/count');

    return response($result->getDecodedBody());
})->middleware('shopify.auth');

Route::get('/api/products/create', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $success = $code = $error = null;
    try {
        ProductCreator::call($session, 5);
        $success = true;
        $code = 200;
        $error = null;
    } catch (\Exception $e) {
        $success = false;

        if ($e instanceof ShopifyProductCreatorException) {
            $code = $e->response->getStatusCode();
            $error = $e->response->getDecodedBody();
            if (array_key_exists("errors", $error)) {
                $error = $error["errors"];
            }
        } else {
            $code = 500;
            $error = $e->getMessage();
        }

        Log::error("Failed to create products: $error");
    } finally {
        return response()->json(["success" => $success, "error" => $error], $code);
    }
})->middleware('shopify.auth');

Route::post('/api/webhooks', function (Request $request) {
    try {
        $topic = $request->header(HttpHeaders::X_SHOPIFY_TOPIC, '');

        $response = Registry::process($request->header(), $request->getContent());
        if (!$response->isSuccess()) {
            Log::error("Failed to process '$topic' webhook: {$response->getErrorMessage()}");
            return response()->json(['message' => "Failed to process '$topic' webhook"], 500);
        }
    } catch (InvalidWebhookException $e) {
        Log::error("Got invalid webhook request for topic '$topic': {$e->getMessage()}");
        return response()->json(['message' => "Got invalid webhook request for topic '$topic'"], 401);
    } catch (\Exception $e) {
        Log::error("Got an exception when handling '$topic' webhook: {$e->getMessage()}");
        return response()->json(['message' => "Got an exception when handling '$topic' webhook"], 500);
    }
});

/**
 * =====================================================
 * =====================================================
 * =====================================================
 * =====================================================
 * START KD routes
 * =====================================================
 * =====================================================
 * =====================================================
 * =====================================================
 */

Route::get('/api/kd/isConnected', function (Request $request) {
  /** @var AuthSession */
  $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

  // $success = $code = $error = $response = null;
  // try {
      // store token and user data in db
      $shop = $_REQUEST['shop'];
      $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();

      $code = 200;
      $response = [
        "success"=>true,
        'code'=>$code,
        'msg'=>'ok',
        'data'=>$ShopifyUser
      ];
  // } catch (\Exception $e) {
  //   $code = 401;
  //   $response = [
  //     "success"=>false, 
  //     'code'=>$code,
  //     'msg'=>"Invalid Access",
  //   ];
  //   Log::error("Failed to create products: ");
  // } finally {
    return response()->json($response, $code);
  // }
});

Route::get('/api/kd/productDimention/{productId}', function (Request $request) {

});

Route::post('/api/kd/connect', function (Request $request) {
  $appUrl = url("/");

  $shop = $_REQUEST['shop'];
  $accessToken = @Session::where('shop', $shop)->where('access_token', '!=', null)->get()[0]->access_token;


  $targetWebhookId = 0;
  /** get webhooks */
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, 'https://'.$shop.'/admin/api/2022-04/webhooks.json');
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_POST, 0);
  $headers = array();
  $headers[] = 'X-Shopify-Access-Token: '.$accessToken;
  $headers[] = 'Content-Type: application/json';
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  $result = curl_exec($ch);
  if (curl_errno($ch)) {
      echo 'Error:' . curl_error($ch);
  }else{
    $result_array = json_decode($result);
    // dmp($result_array);
    foreach(@$result_array->webhooks as $k => $webhook){
      if(stripos($webhook->address, "/syncorder") !== false){
        $targetWebhookId = $webhook->id;
      }
    } // end foreach
    // dmpe($targetWebhookId);
    if($targetWebhookId){
      // delete this webhook
      $chd = curl_init();

      curl_setopt($chd, CURLOPT_URL, 'https://'.$shop.'/admin/api/2022-04/webhooks/'.$targetWebhookId.'.json');
      curl_setopt($chd, CURLOPT_RETURNTRANSFER, 1);
      curl_setopt($chd, CURLOPT_CUSTOMREQUEST, 'DELETE');
      
      $headers = array();
      $headers[] = 'X-Shopify-Access-Token: '.$accessToken;
      curl_setopt($chd, CURLOPT_HTTPHEADER, $headers);
      
      $resultd = curl_exec($chd);
      if (curl_errno($chd)) {
          //  echo 'Error:' . curl_error($ch);
      }
      curl_close($chd);      
    }
  }
  curl_close($ch);
  /** END get webhooks */
  /** Start create webhook for order sync */
  // dmp($shop);
  // dmpe($accessToken);
  $shop = $_REQUEST['shop'];
  $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();
  
  if(!$targetWebhookId){
    $d = [
      'shop'=>$shop,
      'appUrl'=>url()->to("/"),
      'hajexboltToken'=>@$ShopifyUser->hajexbolt_token,
      'shopifyToken'=>@$ShopifyUser->shopify_access_token,
      'accessToken'=>$accessToken,
      'topic'=>'orders/create',
      'mode'=>'create'
    ];
    orderWebhook($d);

    $d['topic'] = "orders/updated";
    $d['mode'] = "updated";
    orderWebhook($d);

    $d['topic'] = "orders/cancelled";
    $d['mode'] = "cancelled";
    $r = orderWebhook($d);
    // dmp($r.'<hr>');

    $d['topic'] = "orders/delete";
    $d['mode'] = "delete";
    $r = orderWebhook($d);
    // dmp($r.'<hr>');

    $d['topic'] = "orders/edited";
    $d['mode'] = "edited";
    $r = orderWebhook($d);
    // dmp($r.'<hr>');

    $d['topic'] = "orders/fulfilled";
    $d['mode'] = "fulfilled";
    $r = orderWebhook($d);
    // dmp($r.'<hr>');

    $d['topic'] = "orders/paid";
    $d['mode'] = "paid";
    $r = orderWebhook($d);
    // dmpe($r.'<hr>');
  }

  // $session = OAuth::callback(
  //   $request->cookie(),
  //   $request->query(),
  //   ['App\Lib\CookieHandler', 'saveShopifyCookie'],
  // );
  // dmpe(Http::shop());
  // dmpe(@Session::get('shop')[0]->shop);
  $response = $success = $code = $error = null;
  try {
      // store token and user data in db
      $token = $_POST['token'];
      $user = json_decode($_POST['user'], true);

      if(!$ShopifyUser){
        // create
        $ShopifyUsers = new ShopifyUsers;
        $ShopifyUsers->is_connect = 1;
        $ShopifyUsers->email = $user['email'];
        $ShopifyUsers->hajexbolt_token = $token;
        $ShopifyUsers->shopify_shop = $shop;
        $ShopifyUsers->hajexbolt_response = $_POST['hajexbolt_response'];
        $ShopifyUsers->shopify_access_token = Session::where('shop', $shop)->where('access_token', '!=', null)->get()[0]->access_token;
        $ShopifyUsers->save();
      }else{
        // update
        $where = [
          'shopify_shop'=>$shop,
        ];
        $data = [
          'is_connect'=>1,
          'email'=>$user['email'],
          'hajexbolt_token'=>$token,
          'hajexbolt_response' => $_POST['hajexbolt_response'],
          'shopify_access_token'=>Session::where('shop', $shop)->where('access_token', '!=', null)->get()[0]->access_token
        ];
        ShopifyUsers::where($where)->update($data);
      }

      $code = 200;
      $response = [
        "success"=>true, 
        'code'=>$code,
        'msg'=>'ok',
      ];
    } catch (\Exception $e) {
      $code = 401;
      $response = [
        "success"=>false, 
        'code'=>$code,
        'msg'=>$e,
      ];
      Log::error("Failed to create products: ");
  } finally {
    return response()->json($response, $code);
  }
});

Route::post('/api/kd/disconnect', function (Request $request) {
  /** @var AuthSession */
  // $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
  // $success = $code = $error = $response = null;
  // try {
      // store token and user data in db
      $shop = $_REQUEST['shop'];
      $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();

      $where = [
        'shopify_shop'=>$shop,
      ];
      $data = [
        'is_connect'=>0,
      ];
      // dmp($where);
      // dmpe($data);
      ShopifyUsers::where($where)->update($data);

      $code = 200;
      $response = [
        "success"=>true,
        'code'=>$code,
        'msg'=>'ok',
        'data'=>[
          'is_connect'=>$ShopifyUser->is_connect
        ]
      ];
  // } catch (\Exception $e) {
    // $code = 401;
    // $response = [
    //   "success"=>false, 
    //   'code'=>$code,
    //   // 'msg'=>$e,
    // ];
    // Log::error("Failed to create products: ");
  // } finally {
    return response()->json($response, $code);
  // }
});

Route::post('/api/kd/getProductDimensionsForWebhook/{product_id}', function (Request $request, $product_id) {
  $shop = $_GET['shop'];
  $shopify_token = $_GET['shopify_token'];
// dmpe($product_id);
      $success = true;
      $code = 200;
      $error = null;

      $where = [
        'shopify_shop'=>$shop,
        'shopify_access_token'=>$shopify_token,
      ];
      $ShopifyUser = ShopifyUsers::where($where)->first();
      // dmpe($ShopifyUser);
      if(!$ShopifyUser){
        $code = 404;
        $response = [
          "success"=>false, 
          'code'=>$code,
          'msg'=>"Information not found.",
        ];
      }else{
        $where = [
          'shopify_shop'=>$shop,
          'product_id'=>$product_id,
        ];
        $productDimensions = ProductDimensions::where($where)->get();
        // dmpe($productDimensions);
        $code = 200;
        $response = [
          "success"=>true, 
          'code'=>$code,
          'msg'=>"Information has been saved successfully.",
          'data'=>$productDimensions
        ];
      }
      // echo '<pre>';
      // print_r($shop);
      // print_r($ShopifyUser);
      // echo '</pre>';
      // exit;
    return response()->json($response, $code);
});


Route::post('/api/kd/getPickupLocation', function (Request $request) {
  $shop = $_GET['shop'];
  $shopify_token = $_GET['shopify_token'];

      $success = true;
      $code = 200;
      $error = null;

      $where = [
        'shopify_shop'=>$shop,
        'shopify_access_token'=>$shopify_token,
      ];
      $ShopifyUser = ShopifyUsers::where($where)->first();
      // dmpe($ShopifyUser);
      if(!$ShopifyUser){
        $code = 404;
        $response = [
          "success"=>false, 
          'code'=>$code,
          'msg'=>"Information not found.",
        ];
      }else{
        $code = 200;
        $response = [
          "success"=>true, 
          'code'=>$code,
          'msg'=>"Information has been saved successfully.",
          'data'=>$ShopifyUser
        ];
      }
      // echo '<pre>';
      // print_r($shop);
      // print_r($ShopifyUser);
      // echo '</pre>';
      // exit;
    return response()->json($response, $code);
});


Route::post('/api/kd/savePickupLocation', function (Request $request) {

  $success = $code = $error = $response = null;
  //try {
      $success = true;
      $code = 200;
      $error = null;

      $shop = $_REQUEST['shop'];
      $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();

      $country = Countries::where(['name'=>$_POST['country']])->first();
      $country_id = @$country->id;
      $country_code = @$country->iso2;

      $where = [
        'name'=>$_POST['state'],
        'country_id'=>$country_id
      ];
      $state = States::where($where)->first();

      if(!$ShopifyUser){
        // insert pickup location
        $ShopifyUsers = new ShopifyUsers;
        $ShopifyUsers->shopify_shop =  $shop;  
        $ShopifyUsers->full_address =  $_POST['full_address'];
        $ShopifyUsers->country = $_POST['country'];
        $ShopifyUsers->state = $_POST['state'];
        $ShopifyUsers->city = $_POST['city'];
        $ShopifyUsers->zipcode = $_POST['zipcode'];
        $ShopifyUsers->company = $_POST['company'];
        $ShopifyUsers->attention = $_POST['attention'];
        $ShopifyUsers->phone = $_POST['phone'];
        $ShopifyUsers->email = $_POST['email'];

        $ShopifyUsers->country_code = $country_code;
        $ShopifyUsers->state_code = @$state->state_code;
        
        $ShopifyUsers->save();
      }else{
        // update pickup location
        $where = [
          'shopify_shop'=>$shop,
        ];
        $data = [
          'full_address'=>$_POST['full_address'],
          'country'=>$_POST['country'],
          'state'=>$_POST['state'],
          'city'=>$_POST['city'],
          'zipcode'=>$_POST['zipcode'],
          'company'=>$_POST['company'],
          'attention'=>$_POST['attention'],
          'phone'=>$_POST['phone'],
          'email'=>$_POST['email'],

          'country_code'=>$country_code,
          'state_code'=>@$state->state_code,
        ];
        ShopifyUsers::where($where)->update($data);
        $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();
      }
      $code = 200;
      $response = [
        "success"=>true, 
        'code'=>$code,
        'msg'=>"Information has been saved successfully.",
      ];
      // echo '<pre>';
      // print_r($shop);
      // print_r($ShopifyUser);
      // echo '</pre>';
      // exit;
    
  // } catch (\Exception $e) {
  //   $code = 401;
  //   $response = [
  //     "success"=>false, 
  //     'code'=>$code,
  //     'msg'=>$e,
  //   ];
  //   Log::error("Failed to create products: ");
  // } finally {
    return response()->json($response, $code);
  // }
});

Route::get('/api/kd/products', function (Request $request) {
  /** @var AuthSession */
  // dmpe(OAuth::user());
  $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
  $success = $code = $error = $response = null;
      // store token and user data in db
      $shop = $_REQUEST['shop'];//@Session::get('shop')[0]->shop;
      $access_token = Session::where('shop', $shop)->where('access_token', '!=', null)->get()[0]->access_token;
      $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();
      // dmpe($shop);
      if($ShopifyUser->is_connect){
        $products = [];
        
        // $client = new Rest($shop, $access_token);
        // $result = $client->get('collects');

        // Generated by curl-to-PHP: http://incarnate.github.io/curl-to-php/
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, 'https://'.$shop.'/admin/api/unstable/products.json');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');

        $headers = array();
        $headers[] = 'X-Shopify-Access-Token: '.$access_token;
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        if (curl_errno($ch)) {
            $code = 401;
            $response = [
              "success"=>false,
              'code'=>$code,
              'msg'=>curl_error($ch)
            ];
        }else{
          $list = json_decode($result)->products;
          // echo '<pre>';
          // print_r((json_encode($list)));
          // echo '</pre>';exit;
          foreach($list as $k => $row){
            $products[$k] = [
              "id"=>$row->id,
              "name"=>$row->title,
              "vendor"=>$row->vendor,
              "status"=>$row->status,
            ];
          }
          $code = 200;
          $response = [
            "success"=>true,
            'code'=>$code,
            'msg'=>'ok',
            'data'=>[
              'is_connect'=>$ShopifyUser->is_connect,
              'products'=>$products
            ]
          ];
        }
        curl_close($ch);
      }else{
        $code = 401;
        $response = [
          "success"=>false,
          'code'=>$code,
          'msg'=>'Invalid Access',
        ];
      }
    return response()->json($response, $code);
});

Route::get('/api/kd/product/{productId}', function (Request $request, $productId) {
  // die($productId);
  /** @var AuthSession */
  $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
  $success = $code = $error = $response = null;
      // store token and user data in db
      $shop = $_REQUEST['shop']; //@Session::get('shop')[0]->shop;
      $access_token = Session::where('shop', $shop)->where('access_token', '!=', null)->get()[0]->access_token;

      $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();

      if($ShopifyUser->is_connect){
        $products = [];
        
        // $client = new Rest($shop, $access_token);
        // $result = $client->get('collects');

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, 'https://'.$shop.'/admin/api/unstable/products/'.$productId.'.json');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');

        $headers = array();
        $headers[] = 'X-Shopify-Access-Token: '.$access_token;
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        // echo $result; exit;
        if (curl_errno($ch)) {
            $code = 401;
            $response = [
              "success"=>false,
              'code'=>$code,
              'msg'=>curl_error($ch)
            ];
        }else{
          $product = json_decode($result)->product;
          $variations = [];
          $variations[0]['value'] = "'0'";
          $variations[0]['label'] = "---";
          foreach($product->variants as $k => $variant){
            $variations[$k+1]['value'] = "'".$variant->id."'";
            $variations[$k+1]['label'] = $variant->title." - ".$variant->weight.$variant->weight_unit." ($".$variant->price.")";
          }
          
          $code = 200;
          $response = [
            "success"=>true,
            'code'=>$code,
            'msg'=>'ok',
            'data'=>[
              'is_connect'=>$ShopifyUser->is_connect,
              'product'=>$product,
              'variations'=>$variations
            ]
          ];
        }
        curl_close($ch);
      }else{
        $code = 401;
        $response = [
          "success"=>false,
          'code'=>$code,
          'msg'=>'Invalid Access',
        ];
      }
    return response()->json($response, $code);
});

// ============
Route::get('/api/kd/getProductDimensions/{product_id}/{variant_id}', function (Request $request, $product_id, $variant_id) {
  // die($productId);
  /** @var AuthSession */
  $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
  $success = $code = $error = $response = null;
      // store token and user data in db
      $shop = $_GET['shop'];
      $access_token = Session::where('shop', $shop)->where('access_token', '!=', null)->get()[0]->access_token;

      $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();

      if($ShopifyUser->is_connect){
        // dmpe($variant_id);
        
        $where = [
          'shopify_shop'=>$shop,
          'product_id'=>$product_id,
          'variant_id'=>$variant_id
        ];
        $list = ProductDimensions::where($where)->get();
        $dimensions = [];
        foreach($list as $k => $row){
          $dimensions[$k] = [
            'id'=>$row->id,
            'width'=>$row->_width,
            'height'=>$row->_height,
            'length'=>$row->_length,
            'weight'=>$row->_weight,
          ];
        }
        if(!$dimensions){
          $dimensions[0] = [
            'id'=>0,
            'width'=>'',
            'height'=>'',
            'length'=>'',
            'weight'=>'',
          ];
        }
        $code = 200;
        $response = [
          "success"=>true,
          'code'=>$code,
          'msg'=>'ok',
          'data'=>[
            'is_connect'=>$ShopifyUser->is_connect,
            'dimensions'=>$dimensions
          ]
        ];
        
      }else{
        $code = 401;
        $response = [
          "success"=>false,
          'code'=>$code,
          'msg'=>'Invalid Access',
        ];
      }
    return response()->json($response, $code);
});



Route::post('/api/kd/saveProductDimensions', function (Request $request) {
  // die($productId);
  /** @var AuthSession */
  $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
  $success = $code = $error = $response = null;
      // store token and user data in db
      $shop = $_REQUEST['shop'];
      $access_token = Session::where('shop', $shop)->where('access_token', '!=', null)->get()[0]->access_token;

      $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();

      if($ShopifyUser->is_connect){
        $dimension_type = $_POST['dimension_type'];
        $variant_id = $_POST['variant_id'];
        $product_id = $_POST['product_id'];
        $PackageDimensions = json_decode($_POST['PackageDimensions']);
        
        
        foreach($PackageDimensions as $k => $PackageDimension){
          if($PackageDimension->id){
            // update
            $where = [
              'shopify_shop'=>$shop,
              'product_id'=>$product_id,
              'variant_id'=>$variant_id,
              'id'=>$PackageDimension->id,
            ];
            $data = [
              'dimension_type'=>$dimension_type,
              '_width'=>$PackageDimension->width,
              '_height'=>$PackageDimension->height,
              '_length'=>$PackageDimension->length,
              '_weight'=>$PackageDimension->weight,
            ];
            ProductDimensions::where($where)->update($data);
          }else{
            // create
            $ProductDimensions_m = new ProductDimensions();
            $ProductDimensions_m->shopify_shop = $shop;
            $ProductDimensions_m->product_id = $product_id;
            $ProductDimensions_m->variant_id = $variant_id;
            $ProductDimensions_m->dimension_type = $dimension_type;
            $ProductDimensions_m->_width = $PackageDimension->width;
            $ProductDimensions_m->_height = $PackageDimension->height;
            $ProductDimensions_m->_length = $PackageDimension->length;
            $ProductDimensions_m->_weight = $PackageDimension->weight;
  
            $ProductDimensions_m->save();
          }
        }

        $code = 200;
        $response = [
          "success"=>true,
          'code'=>$code,
          'msg'=>'ok',
          'data'=>[
            'is_connect'=>$ShopifyUser->is_connect,
          ]
        ];
      }else{
        $code = 401;
        $response = [
          "success"=>false,
          'code'=>$code,
          'msg'=>'Invalid Access',
        ];
      }
    return response()->json($response, $code);
});

Route::post('/api/kd/deleteProductDimensions', function (Request $request) {
  // die($productId);
  /** @var AuthSession */
  $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
  $success = $code = $error = $response = null;
      // store token and user data in db
      $shop = @Session::get('shop')[0]->shop;
      $access_token = Session::where('shop', $shop)->where('access_token', '!=', null)->get()[0]->access_token;

      $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();

      if($ShopifyUser->is_connect){
        $id = $_POST['id'];
        $where = [
          'shopify_shop'=>$shop,
          'id'=>$id,
        ];
        // dmpe($where);
        ProductDimensions::where($where)->delete();
        $code = 200;
        $response = [
          "success"=>true,
          'code'=>$code,
          'msg'=>'ok',
          'data'=>[
            'is_connect'=>$ShopifyUser->is_connect,
          ]
        ];
      }else{
        $code = 401;
        $response = [
          "success"=>false,
          'code'=>$code,
          'msg'=>'Invalid Access',
        ];
      }
    return response()->json($response, $code);
});

Route::get('/api/kd/countries', function (Request $request) {
  // die($productId);
  /** @var AuthSession */
  $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
  $success = $code = $error = $response = null;
      // store token and user data in db
      $shop = @Session::get('shop')[0]->shop;
      $access_token = Session::where('shop', $shop)->where('access_token', '!=', null)->get()[0]->access_token;

      $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();

      if($ShopifyUser->is_connect){
        $list = Countries::get();
        $countries = [
          // ['label'=>'-- Choose Country --', 'value'=>""]
        ];
        foreach($list as $k => $row){
          $countries[$k] = [
            'label'=>$row->name,
            'value'=>$row->name,
          ];
        }

        $code = 200;
        $response = [
          "success"=>true,
          'code'=>$code,
          'msg'=>'ok',
          'data'=>[
            'is_connect'=>$ShopifyUser->is_connect,
            'countries'=>$countries
          ]
        ];
      }else{
        $code = 401;
        $response = [
          "success"=>false,
          'code'=>$code,
          'msg'=>'Invalid Access',
        ];
      }
    return response()->json($response, $code);
});

Route::get('/api/kd/states', function (Request $request) {
  // die($productId);
  /** @var AuthSession */
  $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
  $success = $code = $error = $response = null;
      // store token and user data in db
      $shop = @Session::get('shop')[0]->shop;
      $access_token = Session::where('shop', $shop)->where('access_token', '!=', null)->get()[0]->access_token;

      $ShopifyUser = ShopifyUsers::where('shopify_shop', '=', $shop)->first();

      if($ShopifyUser->is_connect){
        $country_name = $_GET['country_name']; // country name
        $country = Countries::where(['name'=>$country_name])->first();
        if(@$country->name){
          $list = States::where(['country_id'=>$country->id])->get();
          $states = [
            // ['label'=>'-- Choose State --', 'value'=>""]
          ];
          foreach($list as $k => $row){
            $states[$k] = [
              'label'=>$row->name,
              'value'=>$row->name,
            ];
          }
        }else{
          $states = [];
        }

        $code = 200;
        $response = [
          "success"=>true,
          'code'=>$code,
          'msg'=>'ok',
          'data'=>[
            'is_connect'=>$ShopifyUser->is_connect,
            'countries'=>$states
          ]
        ];
        
      }else{
        $code = 401;
        $response = [
          "success"=>false,
          'code'=>$code,
          'msg'=>'Invalid Access',
        ];
      }
    return response()->json($response, $code);
});


/**
 * =====================================================
 * =====================================================
 * =====================================================
 * =====================================================
 * END BACKEND KD routes
 * =====================================================
 * =====================================================
 * =====================================================
 * =====================================================
 */

/**
 * =====================================================
 * =====================================================
 * =====================================================
 * =====================================================
 * START FRONTEND KD routes
 * =====================================================
 * =====================================================
 * =====================================================
 * =====================================================
 */
Route::get('/api/kd/syncOrder', function (Request $request) {
  $filePath = 'syncOrder.txt';
  $content = $_GET['shop'];
  
  $file = fopen($filePath, 'w');
  fwrite($file, $content);
  fclose($file);

  // Handle the create order webhook request
  $webhookPayload = file_get_contents('php://input');
  $webhookData = json_decode($webhookPayload, true);

  // Ensure the webhook payload is valid
  if (json_last_error() === JSON_ERROR_NONE && !empty($webhookData)) {
    // Handle the create order webhook
    if ($webhookData['topic'] === 'orders/create') {
        handleCreateOrderWebhook($webhookData['data']);
    }
  }
  exit;

  $filePath = 'syncOrder.txt';
  $content = $_GET['shop'];
  
  $file = fopen($filePath, 'w');
  fwrite($file, $content);
  fclose($file);


  /** get webhooks */

  return false;
  // send request to hajexbolt /api/store-order
  $endpoint = env("HB_API_URL")."api/store-order"; // botl API
  $token = "your_token_here";
  
  $headers = array(
    "Accept: application/json",
    "Authorization: Bearer " . $token
  );
  
  $data = array(
    "order_id" => 1917,
    "customer_id" => 1,
    "status" => "processing",
    "currency" => "USD",
    "customer_note" => "",
    "payment_method_title" => "Cash on delivery",
    "date_created" => "2023-06-11 22:12:19",
    "discount_total" => 0,
    "discount_tax" => 0,
    "selected_shipping_detail" => array(),
    "shipping_total" => 49.31,
    "shipping_tax" => 0,
    "total" => 69.31,
    "total_tax" => 0,
    "billing" => array(
      "first_name" => "Arthur",
      "last_name" => "Davis",
      "company" => "test",
      "address_1" => "59 Victoria St",
      "address_2" => "",
      "city" => "Bayfield",
      "state" => "ON",
      "postcode" => "N0M 1G0",
      "country" => "CA",
      "email" => "aasd@asd.com",
      "phone" => "5555554206"
    ),
    "shipping" => array(
      "first_name" => "Arthur",
      "last_name" => "Davis",
      "company" => "test",
      "address_1" => "59 Victoria St",
      "address_2" => "",
      "city" => "Bayfield",
      "state" => "ON",
      "state_name" => "",
      "postcode" => "N0M 1G0",
      "country" => "CA",
      "state_name" => "",
      "phone" => ""
    ),
    "warehouse" => array(
      "full_address" => "59 Victoria St",
      "country" => "CA",
      "country_name" => "Canada",
      "state_provience" => "QC",
      "state_name" => "Quebec",
      "city_town" => "Anjou",
      "zip_postal" => "H1J1J3",
      "company" => "test company",
      "attention" => "Attention test",
      "phone" => "5555554206",
      "email" => "arthur@uplift.com"
    )
  );

  $data["items"][] =
    array(
      "item_id" => 349,
      "active_price" => 20,
      "regular_price" => null,
      "sale_price" => 20,
      "sku" => "woo-beanie",
      "product_name" => "Beanie",
      "item_quantity" => 1,
      "length" => 15,
      "width" => 22,
      "height" => 33,
      "weight" => 10,
      "product_length_type" => "Imperial",
      "bolt_package_detail" => array(
        "6323d732d4" => array(
          "length" => 20,
          "width" => 20,
          "height" => 20,
          "weight" => 20
        ),
        "f02dd35ab6" => array(
          "length" => 20,
          "width" => 20,
          "height" => 20,
          "weight" => 20
        )
      ),
      "item_subtotal" => 20,
      "item_subto_tax" => 0,
      "item_total" => 20,
      "item_total_tax" => 0,
      "item_tax_status" => "taxable"
    );

  
  $ch = curl_init($endpoint);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
  
  $response = curl_exec($ch);
  
  if ($response === false) {
    echo "cURL Error: " . curl_error($ch);
  } else {
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    echo "HTTP Code: " . $httpCode . "\n";
    echo "Response: " . $response . "\n";
  }
  curl_close($ch);
}); // END sync order

Route::get('/api/kd/getOrderDetail', function (Request $request) {
  $referralUrl = $request->header('referer');
  $referralUrl = str_replace("https://", "", $referralUrl);
  $shop = rtrim($referralUrl, "/");
  // dmpe($shop);

  $success = $code = $error = $response = null;

    $where = [
      'shopify_shop'=>$shop,
      'is_connect'=>1,
    ];
    $ShopifyUser = ShopifyUsers::where($where)->first();
    if($ShopifyUser){
      $ch = curl_init();

      curl_setopt($ch, CURLOPT_URL, 'https://'.$shop.'/admin/api/2023-04/orders/1013.json?fields=id%2Cline_items%2Cname%2Ctotal_price');
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');

      $headers = array();
      $headers[] = 'X-Shopify-Access-Token: '.$ShopifyUser->shopify_access_token;
      curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

      $result = curl_exec($ch);
      dmpe($result);
      // echo $result; exit;
      // if (curl_errno($ch)) {
      //     $code = 401;
      //     $response = [
      //       "success"=>false,
      //       'code'=>$code,
      //       'msg'=>curl_error($ch)
      //     ];
      // }else{
      //   $code = 200;
      //   $response = [
      //     "success"=>true,
      //     'code'=>$code,
      //     'msg'=>'ok',
      //     'data'=>$ShopifyUser
      //   ];
      // }
    }else{
      $code = 403;
      $response = [
        "success"=>false,
        'code'=>$code,
        'msg'=>'You are not connected to app',
      ];
    }
    dmpe($response);
    // return response()->json($response, $code);
});

Route::get('/api/kd/getProductsDetail', function (Request $request) {
  $referralUrl = $request->header('referer');
  $referralUrl = str_replace("https://", "", $referralUrl);
  $shop = rtrim($referralUrl, "/");
  // dmpe($shop);
  

  $success = $code = $error = $response = null;

    $where = [
      'shopify_shop'=>$shop,
      'is_connect'=>1,
    ];
    $ShopifyUser = ShopifyUsers::where($where)->first();
    if($ShopifyUser){
      $productData = [];
      $productIds = $_POST['productIds'];
      foreach($productIds as $k => $productId){
        $where = [
          'shopify_shop'=>$shop,
          'product_id'=>$productId
        ];
        $list = ProductDimensions::where($where)->get();
        foreach($list as $k2 => $row){
          $productData[] = $row;
        }
      }
    
      // echo $result; exit;
      $code = 200;
      $response = [
        "success"=>true,
        'code'=>$code,
        'msg'=>'ok',
        'data'=>$productData
      ];
    }else{
      $code = 403;
      $response = [
        "success"=>false,
        'code'=>$code,
        'msg'=>'You are not connected to app',
      ];
    }
    // dmpe($response);
    return response()->json($response, $code);
});



/**
 * =====================================================
 * =====================================================
 * =====================================================
 * =====================================================
 * END BACKEND KD routes
 * =====================================================
 * =====================================================
 * =====================================================
 * =====================================================
 */
