// export const BASE_URL = 'https://ship.hajexbolt.com/ship_api/public/api/';
export const BASE_URL = 'https://dev-ship.hajexbolt.com/ship_api/public/api/';

export const KdStyles = {
  dropdown:{
    paddingTop:10,
    paddingBottom:10,
    paddingLeft:5,
    paddingRight:5,
    borderRadius:3,
    width:'100%',
    borderWidth:'0.0625rem',
    borderColor:'#ABB1BA'
  }
}

export const storeURL = () => {
  var _url = window.location.href;
  const regex = /[?&]shop=([^&#]*)/;
  const match = regex.exec(_url);
  // alert("match "+match);
  if(match && match != null){
    var _shop = decodeURIComponent(match[1].replace(/\+/g, ' '));
    return _shop;
  }else{
    return false;
  }
}

function createCookie(name, value, days) {
  if(!value){
    return;
  }
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires; // + "; path=/";
  console.log("kd document.cookie", document.cookie);
}

function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1, cookie.length);
    }
  }
  return null;
}