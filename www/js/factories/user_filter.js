Pta.factory('userFilter', function(){
  return function(parents, search){
    // Future work - Make parent's searchable by their child's current teacher
    var options,
        parsedSearch = parseInt(search),// Integer of grade OR NaN
        displayableOptions = function(contactsFound){
          var madeDisplayable = [];
          angular.forEach(contactsFound, function(value, key){
              var contact = value;
              contact.label = value.name + " " + "<" + value.email + ">"
              madeDisplayable.push(contact);
          });
          return madeDisplayable;
        }
    if(search){
      if(isNaN(parsedSearch)){
        options = [];
        var properties = ['name', 'email', 'children'];
        angular.forEach(parents, function(parent){
          for (var i = properties.length - 1; i >= 0; i--) {
            //We're not on the 'children' property && this parent has this property set && this parent's name or email was matched && This parent isn't already in options
            if(i < properties.length - 1 && parent[properties[i]] && parent[properties[i]].indexOf(search) >= 0 && options.map(function(el){ return el.$id }).indexOf(parent.$id)< 0){
              options.push(parent);
            } else {
              angular.forEach(parent.children, function(value, key){
                if(value.name.indexOf(search) >= 0 && options.map(function(el){ return el.$id }).indexOf(parent.$id) < 0){
                  options.push(parent);
                }
              });
            }
          }
        });
      } else {
        if(typeof parsedSearch === "number") {
          options = [];
          angular.forEach(parents, function(parent){
            if(parent.children){
              angular.forEach(parent.children, function(child){
                //This parent has a child in the grade level searched && this child's parent isn't already in options
                if(child.grade === parsedSearch && options.map(function(el){ return el.$id }).indexOf(parent.$id) < 0){
                  options.push(parent);
                }
              });
            }
          });
        }  
      }
      return displayableOptions(options); 
    } else {
      return displayableOptions(parents);
    }
  }
});