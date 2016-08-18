Pta.factory('userService', function () {
  var service = {
    _user: null,
    setUser: function (user) {
      if (user && !user.error) {
        service._user = user;
        return service.getUser();
      } else {
        return user.error;
      }
    },
    getUser: function () {
      return service._user;
    }
  };
  return service;
});