Pta.factory('time', function(){
  return{

    parseTime: function (timeStr, dt) {
      if (!dt) {
          dt = new Date();
      }

      var time = timeStr.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
      if (!time) {
          return NaN;
      }
      var hours = parseInt(time[1], 10);
      if (hours == 12 && !time[3]) {
          hours = 0;
      }
      else {
          hours += (hours < 12 && time[3]) ? 12 : 0;
      }

      dt.setHours(hours);
      dt.setMinutes(parseInt(time[2], 10) || 0);
      dt.setSeconds(0, 0);
      return dt;
    }
  }
});