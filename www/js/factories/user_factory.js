Pta.factory('userService', function () {
  var service = {
    _user: null,
    setUser: function (u) {
      if (u && !u.error) {
        service._user = u;
        return service.getUser();
      } else {
        return u.error;
      }
    },
    getUser: function () {
      return service._user;
    }
  };
  return service;
});