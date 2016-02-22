'use strict';

var app = angular.module('fileUpload', ['ngFileUpload']);

app.controller('MyCtrl', function ($scope, $http, $timeout, Upload) {
    $scope.$watch('file', function(file) {
      if (file) {
        return Upload.upload({
          url: 'http://pb-img.cloudapp.net:3000/upload',
          headers: {
            'optional-header': 'header-value'
          },
          file: file
        }).progress(function(evt) {
          console.log('evt', evt);
          return file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        }).success(function(data, status, headers, config) {
          $timeout(function() {
            return file.result = data;
          });
        }).error(function(data, status, headers, config) {
          return alert('error status: ' + status);
        });
      }
    });

    $scope.update = function() {
      return;
    };
});
