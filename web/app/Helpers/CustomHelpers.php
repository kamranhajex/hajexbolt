<?php
use Illuminate\Support\Facades\Auth;
use App\Models\Session;

if(!function_exists('dmp')){
  function dmp($data)
  {
    echo "<pre>";
    print_r($data);
    echo "</pre>";
  }
}

if(!function_exists('dmpe')){
  function dmpe($data)
  {
    echo "<pre>";
    print_r($data);
    echo "</pre>";
    exit;
  }
}

function getAccessToken($shopUrl) {
  $url = "https://$shopUrl/admin/oauth/access_token";
  $payload = [
      'client_id' => env('SHOPIFY_API_KEY'),
      'client_secret' => env('SHOPIFY_API_SECRET'),
      // 'code' => $code,
  ];
  // dmpe($payload);

  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
  $response = curl_exec($ch);
  curl_close($ch);
  dmpe(curl_error($ch));
  $responseArray = json_decode($response, true);
  return $responseArray['access_token'];
}


// Define the callback function to handle the create order webhook
function handleCreateOrderWebhook($data) {
  // Extract relevant data from the webhook payload
  $orderId = $data['id'];
  $customerEmail = $data['email'];
  // ... other order data you need

  // Handle custom product fields data
  $lineItems = $data['line_items'];
  foreach ($lineItems as $lineItem) {
      $productId = $lineItem['product_id'];
      $variantId = $lineItem['variant_id'];

      // Get custom field values for the product
      $customField1 = "";
      $customField2 = "";
      if (isset($lineItem['properties']) && is_array($lineItem['properties'])) {
          foreach ($lineItem['properties'] as $property) {
              if ($property['name'] === "custom_field1") {
                  $customField1 = $property['value'];
              }
              if ($property['name'] === "custom_field2") {
                  $customField2 = $property['value'];
              }
          }
      }

      // Process the custom field values for the product
      // ... your custom logic here
  }

  // Perform any other necessary actions based on the order and custom field data
  // ... your custom logic here
}

function regenerateAccessToken($shop, $_currentAccessToken){
  $apiKey = env('SHOPIFY_API_KEY');
  $apiSecret = env('SHOPIFY_API_SECRET');
  $currentAccessToken = $_currentAccessToken;
  
  // Set the Shopify API endpoint URL
  $url = 'https://'.$shop.'/admin/api/2021-07/graphql.json';
  
  // Define the GraphQL mutation for regenerating the access token
  $mutation = <<<GRAPHQL
  mutation {
    appApiKeyAuthenticateMutation {
      apiKey {
        accessToken
      }
    }
  }
  GRAPHQL;
  
  // Create the cURL request
  $curl = curl_init($url);
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl, CURLOPT_POST, true);
  curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode(['query' => $mutation]));
  curl_setopt($curl, CURLOPT_HTTPHEADER, [
      'Content-Type: application/json',
      'X-Shopify-Access-Token: ' . $currentAccessToken,
  ]);
  
  // Execute the cURL request and get the response
  $response = curl_exec($curl);
  
  // Check for any cURL errors
  if (curl_errno($curl)) {
      $error = curl_error($curl);
      // Handle the error
      // ...
  }
  
  // Close the cURL request
  curl_close($curl);
  
  // Parse the response
  $data = json_decode($response, true);
  $newAccessToken = null;
  // Check for errors in the GraphQL response
  if (isset($data['errors'])) {
      $errors = $data['errors'];
      // Handle the error response
      // ...
  } else {
      // Access the new access token
      $newAccessToken = $data['data']['appApiKeyAuthenticateMutation']['apiKey']['accessToken'];
      // ...
  }
  $where = [
    'shop'=>$shop,
  ];
  $data = [
    'access_token'=>$errors
  ];
  Session::where($where)->update($data);
  return $newAccessToken;
} // END func


function orderWebhook($d = []){
  if(!$d){
    return false;
  }
  foreach($d as $name => $v){
    $$name = $v;
  } // end foreach
  $webhookUrl = "https://mmelogics.com/hajex/index.php?shop=$shop&appUrl=$appUrl&hajexboltToken=$hajexboltToken&shopifyToken=$shopifyToken&mode=$mode";
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, 'https://'.$shop.'/admin/api/2023-07/webhooks.json');
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, "{\"webhook\":{\"address\":\"$webhookUrl\",\"topic\":\"$topic\",\"format\":\"json\"}}");
  $headers = array();
  $headers[] = 'X-Shopify-Access-Token: '.$accessToken;
  $headers[] = 'Content-Type: application/json';
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  $result = curl_exec($ch);
  // if (curl_errno($ch)) {
  //     echo 'Error:' . curl_error($ch);
  // }
  curl_close($ch);
  return $result;
}
