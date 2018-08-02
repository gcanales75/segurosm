var adminPaymentsApp = angular.module("adminAppAuth", ['ngRoute', 'ngCookies'])

adminPaymentsApp.config(["$routeProvider", "$locationProvider", "loginProvider", function ($routeProvider, $locationProvider, loginProvider) {
//adminPaymentsApp.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix("");
    $routeProvider.when('/', {
        templateUrl: '/templates/templateHome.html',
        controller: 'homeController'
    })
        .when('/usuarios', {
            templateUrl: '/templates/usersTemplate.html',
            controller: 'usersController'
        })
        .when('/roles', {
            templateUrl: '/templates/rolesTemplate.html',
            controller: 'rolesController'
        })
        .when('/appclients', {
            templateUrl: '/templates/appClientsTemplate.html',
            controller: 'appClientsController'
        })
        .when('/404', {
            templateUrl: '/templates/404.html'
        })
        .when('/login', {
            templateUrl: '/templates/login.html',
            controller: 'loginController'
        })
        .otherwise({
            redirectTo: '/404'
        });
    loginProvider.init("AIzaSyDajWGJNptevjYORuS9Bg0hpaZkvMYOm00", "adminpaymentserver.firebaseapp.com", "adminpaymentserver", "805902455100");
}]);

adminPaymentsApp.provider('$login', loginProvider)
                .run(instantiateLogin);

instantiateLogin.$inject = ['$injector'];
function instantiateLogin($injector) {
    $injector.get('$login');
}

function loginProvider() {
    /*var config = {
        apiKey: "AIzaSyDajWGJNptevjYORuS9Bg0hpaZkvMYOm00",
        authDomain: "adminpaymentserver.firebaseapp.com",
        databaseURL: "https://adminpaymentserver.firebaseio.com",
        projectId: "adminpaymentserver",
        storageBucket: "adminpaymentserver.appspot.com",
        messagingSenderId: "805902455100"
    };*/
    var _firebaseApp = null;
    var _provider = null;
    var _config = null;
    this.init = function (apiKey, authDomain, projectId, messagingSenderId) {
        _config = {
            apiKey: apiKey,
            authDomain: authDomain,
            projectId: projectId,
            messagingSenderId: messagingSenderId
        };
        _firebaseApp = firebase.initializeApp(config);
        _provider = new firebase.auth.GoogleAuthProvider();
    };

    this.$get = [function () {
        var config = _config;
        var firebaseApp = _firebaseApp;
        var provider = _provider;
        var $login = new Object();
        $login.user = null;
        $login.credentials = null;
        $login.token = null;
        $login.isAutenticated = false;
        $login.errorCode = null;
        $login.errorMessage = "";
        $login.login = function () {
            firebase.auth()
                .signInWithPopup(provider)
                .then(function (result) {
                    $login.token = result.credential.accessToken;
                    $login.credentials = result.credential;
                    $login.user = result.user;
                    $login.isAutenticated = true;
                }).catch(function (error) {
                    $login.errorCode = error.code;
                    $login.errorMessage = error.message;
                    $login.isAutenticated = false;
                });
        };
        $login.logout = function () {
            firebaseApp.auth().signOut().then(function () {
                $login.token = null;
                $login.credentials = null;
                $login.user = null;
                $login.isAutenticated = false;
            }).catch(function (error) {
                $login.errorCode = error.code;
                $login.errorMessage = error.message;
            });
        };
        $login.isLoggedIn = function () {
            return firebaseApp.getAuth();
        }
        return $login;
    }];
};