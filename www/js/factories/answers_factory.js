// Watches for authentication event. If login occurs, then get the user's profile info and go to calender or volunteer page
Pta.factory('Answers', [
  function(){
  return {
    sendPurchase: function(itemPrice, currency, success, itemName, itemType, itemId, attributes) {
      window.fabric.core.execPlugin('sendPurchase', [itemPrice, currency, success, itemName, itemType, itemId, attributes]);
    },
    sendAddToCart: function(itemPrice, currency, itemName, itemType, itemId, attributes) {
      window.fabric.core.execPlugin('sendAddToCart', [itemPrice, currency, itemName, itemType, itemId, attributes]);
    },
    sendStartCheckout: function(totalPrice, currency, itemCount, attributes) {
      window.fabric.core.execPlugin('sendStartCheckout', [totalPrice, currency, itemCount, attributes]);
    },
    sendSearch: function(query, attributes) {
      window.fabric.core.execPlugin('sendSearch', [query, attributes]);
    },
    sendShare: function(method, contentName, contentType, contentId, attributes) {
      window.fabric.core.execPlugin('sendShare', [method, contentName, contentType, contentId, attributes]);
    },
    sendRatedContent: function(rating, contentName, contentType, contentId, attributes) {
      window.fabric.core.execPlugin('sendRatedContent', [rating, contentName, contentType, contentId, attributes]);
    },
    sendSignUp: function(method, success, attributes) {
      window.fabric.core.execPlugin('sendSignUp', [method, success, attributes]);
    },
    sendLogIn: function(method, success, attributes) {
      window.fabric.core.execPlugin('sendLogIn', [method, success, attributes]);
    },
    sendInvite: function(method, attributes) {
      window.fabric.core.execPlugin('sendInvite', [method, attributes]);
    },
    sendLevelStart: function(levelName, attributes) {
      window.fabric.core.execPlugin('sendLevelStart', [levelName, attributes]);
    },
    sendLevelEnd: function(levelName, score, success, attributes) {
      window.fabric.core.execPlugin('sendLevelEnd', [levelName, score, success, attributes]);
    },
    sendContentView: function(name, type, id, attributes) {
      window.fabric.core.execPlugin('sendContentView', [name, type, id, attributes]);
    },
    sendScreenView: function(name, id, attributes) {
      window.fabric.core.execPlugin('sendContentView', [name, "Screen", id, attributes]);
    },
    sendCustomEvent: function(name, attributes) {
      window.fabric.core.execPlugin('sendCustomEvent', [name, attributes]);
    }
  }
}]);
