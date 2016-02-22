var mymodal = angular.module('mymodal', []);

mymodal.controller('MainCtrl', function ($scope,$http) {
	function refresh() {
		$http.get('/list').then(
			function onSuccess(response) {
				$scope.images = response.data;
			}
			,
			function onError(response) {
			}
		);
	}
	refresh();
	$scope.elimina = function(id) {
		$http.delete('/del/'+id).then(
			function onSuccess(response) {
				refresh();
			}
			,
			function onError(response) {
				//alert(JSON.stringify(response));
			}
		);
	}
  });
