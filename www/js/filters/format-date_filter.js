Pta.filter('formatDate', function(){
  return function(date){
    var now = moment(),
        date = moment(date),
        comparator = now.diff(date);    
    switch(true){
      case (comparator < 3000):
        return "Just now";
        break;
      case (comparator < 5400000)://less than 90 minutes ago
        return date.fromNow();
        break;
      case (comparator < 604800000):
        return date.format('dd MMM Do h:m a');// less than a week ago
        break;
      default: 
        if(date.isSame(now, 'year')){
          return date.format('MMM Do');
        } else {
          return date.format('M/D/YYYY');
        }
        break;
    }
  }
});