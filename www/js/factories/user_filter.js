Pta.factory('userFilter', function(){
  return function(parents, search){
    var options,
        parsedSearch = parseInt(search);// Integer of grade OR NaN
    if(isNaN(parsedSearch)){
      options = [];
      var properties = ['name', 'email', 'children'];
      angular.forEach(parents, function(parent){
        for (var i = properties.length - 1; i >= 0; i--) {
          //We're not on the 'children' property && this parent has this property set && this parent's name or email was matched && This parent isn't already in options
          if(i < properties.length - 1 && parent[properties[i]] && parent[properties[i]].indexOf(search) >= 0 && options.map(function(el){ return el.$id }).indexOf(parent.$id)< 0){
            options.push(parent);
          } else {
            for (var x = parent.children.length - 1; x >= 0; x--) {
              //The Child's name has been matched && this child's parent isn't already in options
              if(parent.children[x].name.indexOf(search) >= 0 && options.map(function(el){ return el.$id }).indexOf(parent.$id) < 0){
                options.push(parent);
              }
            }
          }
        }
      });
    } else {
      if(typeof parsedSearch === "number") {
        options = [];
        angular.forEach(parents, function(parent){
          for (var x = parent.children.length - 1; x >= 0; x--) {
            //This parent has a child in the grade level searched && this child's parent isn't already in options
            if(parent.children[x].grade === parsedSearch && options.map(function(el){ return el.$id }).indexOf(parent.$id) < 0){
              options.push(parent);
            }
          }
        });
      }  
    }
    var displayableOptions = function(contactsFound){
      var madeDisplayable = [];
      angular.forEach(contactsFound, function(value, key){
          var contact = {};
          contact.email = value.email
          contact.id = value.$id;
          contact.label = value.name + " " + "<" + value.email + ">"
          madeDisplayable.push(contact);
      });
      return madeDisplayable;
    }
    return displayableOptions(options); 
  }
});