Pta.filter('formatDate', function(){
  return function(date){
    var now = moment(),
        newMoment = moment(date),
        comparator = now.diff(date);    
    switch(true){
      case (comparator < 3000):
        return "Just now";
      case (comparator < 5400000)://less than 90 minutes ago
        return newMoment.fromNow();
      case (comparator < 604800000):
        return newMoment.format('dd MMM Do h:m a');// less than a week ago
      default: 
        if(newMoment.isSame(now, 'year')){
          return newMoment.format('MMM Do');
        } else {
          return newMoment.format('M/D/YYYY');
        }
    }
  };
});