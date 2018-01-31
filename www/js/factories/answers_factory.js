// Watches for authentication event. If login occurs, then get the user's profile info and go to calender or volunteer page
Pta.factory('Answers', [
  function(){
  return {
    sendPurchase: function sendPurchase(itemPrice, currency, success, itemName, itemType, itemId, attributes) {
      window.fabric.core.execPlugin('sendPurchase', [itemPrice, currency, success, itemName, itemType, itemId, attributes]);
    },
    sendAddToCart: function sendAddToCart(itemPrice, currency, itemName, itemType, itemId, attributes) {
      window.fabric.core.execPlugin('sendAddToCart', [itemPrice, currency, itemName, itemType, itemId, attributes]);
    },
    sendStartCheckout: function sendStartCheckout(totalPrice, currency, itemCount, attributes) {
      window.fabric.core.execPlugin('sendStartCheckout', [totalPrice, currency, itemCount, attributes]);
    },
    sendSearch: function sendSearch(query, attributes) {
      window.fabric.core.execPlugin('sendSearch', [query, attributes]);
    },
    sendShare: function sendShare(method, contentName, contentType, contentId, attributes) {
      window.fabric.core.execPlugin('sendShare', [method, contentName, contentType, contentId, attributes]);
    },
    sendRatedContent: function sendRatedContent(rating, contentName, contentType, contentId, attributes) {
      window.fabric.core.execPlugin('sendRatedContent', [rating, contentName, contentType, contentId, attributes]);
    },
    sendSignUp: function sendSignUp(method, success, attributes) {
      window.fabric.core.execPlugin('sendSignUp', [method, success, attributes]);
    },
    sendLogIn: function sendLogIn(method, success, attributes) {
      window.fabric.core.execPlugin('sendLogIn', [method, success, attributes]);
    },
    sendInvite: function sendInvite(method, attributes) {
      window.fabric.core.execPlugin('sendInvite', [method, attributes]);
    },
    sendLevelStart: function sendLevelStart(levelName, attributes) {
      window.fabric.core.execPlugin('sendLevelStart', [levelName, attributes]);
    },
    sendLevelEnd: function sendLevelEnd(levelName, score, success, attributes) {
      window.fabric.core.execPlugin('sendLevelEnd', [levelName, score, success, attributes]);
    },
    sendContentView: function sendContentView(name, type, id, attributes) {
      window.fabric.core.execPlugin('sendContentView', [name, type, id, attributes]);
    },
    sendScreenView: function sendScreenView(name, id, attributes) {
      window.fabric.core.execPlugin('sendContentView', [name, "Screen", id, attributes]);
    },
    sendCustomEvent: function sendCustomEvent(name, attributes) {
      window.fabric.core.execPlugin('sendCustomEvent', [name, attributes]);
    }
  }
}]);
