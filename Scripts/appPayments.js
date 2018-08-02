var appPaymentMethod = angular.module('paymentsTest', []);
appPaymentMethod.controller('paymentsController', function ($scope, $window) {
    $scope.tc = function () {
        $window.alert('Ha dado click en tc');
    }
    $scope.pse = function () {
        $window.alert('Ha dado click en pse');
    }
});