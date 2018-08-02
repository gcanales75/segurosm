(function (window, angular) {
    'use strict';
    var ngMundialPayments = angular.module('ngMundialPayments', ['ngCookies'])
        .info({ angularVersion: '1.7.0-rc.0' })
        .provider('$mundialPayments', $MundialPaymentsProvider)
        .directive('ngMunButtons', ngMunButtonsDirective)
        .directive('ngMunVoucherConfirm', ngMunVoucherConfirmDirective)
        .directive('ngMunConfirmPayment', ngMunConfirmPaymentDirective)
        .run(instantiateMundial);
    var $mundialPaymentsMinErr = angular.$$minErr('ngMundialPayments');
    
    instantiateMundial.$inject = ['$injector'];
    function instantiateMundial($injector) {
        $injector.get('$mundialPayments');
    }
    
    function $MundialPaymentsProvider() {
        var _remoteServiceHost;
        var _remoteAuthHost;
        var _urlCallback;
        var _urlOuth;
        var _urlRefresh;
        var _state;
        var _tClientId;
        var _tUserId;
        var _imgLoading;
        this.initMundialProvider = function (remoteServiceHost, remoteAuthHost, clientId, userId) {
            //debugger;
            _remoteServiceHost = remoteServiceHost;
            _remoteAuthHost = remoteAuthHost;
            _urlCallback = _remoteAuthHost + "/api/Account/CallbackExternal";
            _urlOuth = _remoteAuthHost + "/api/Account/Auth";
            _tClientId = clientId;
            _tUserId = userId;
        }

        this.initMundialProvider = function (remoteServiceHost, remoteAuthHost, clientId, userId, imgLoading) {
            //debugger;
            _remoteServiceHost = remoteServiceHost;
            _remoteAuthHost = remoteAuthHost;
            _urlCallback = _remoteAuthHost + "/api/Account/CallbackExternal";
            _urlOuth = _remoteAuthHost + "/api/Account/Auth";
            _urlRefresh = _remoteAuthHost + "/api/Account/token";
            _tClientId = clientId;
            _tUserId = userId;
            _imgLoading = imgLoading;
        }

        function inherit(parent, extra) {
            return angular.extend(Object.create(parent), extra);
        }

        this.$get = ['$window', '$http', '$interval', '$cookies', function ($window, $http, $interval, $cookies) {
            //debugger;
            var $mundialPayments = new Object();
            var authObject = new Object();
            var remoteServiceHost = _remoteServiceHost;
            var remoteAuthHost = _remoteAuthHost;
            var urlCallback = _urlCallback;
            var urlOuth = _urlOuth;
            var urlRefresh = _urlRefresh;
            var state = $cookies.get("pState");
            if (!state) {
                state = (!state ? st() : state);
                $cookies.put("pState", state);
            }
            var appToken;
            var refresh_token;
            var refresh;
            var expires;
            var token_type;
            var tClientId = _tClientId;
            var tUserId = _tUserId;
            var triesAuth = 0;
            var triesCP = 0;
            var triesDC = 0;
            var triesPM = 0;
            var idIntervalAuth = 0;
            var idIntervalPm = 0;
            var idIntervalCp = 0;
            var idIntervalDc = 0;
            var processingRefreshToken = false;
            if (_imgLoading) {
                $mundialPayments.imgLoading = _imgLoading
                $mundialPayments.isLoading = true;
            } else {
                $mundialPayments.isLoading = false;
            }
            
            $mundialPayments.executed = false;
            $mundialPayments.remoteServiceHost = remoteServiceHost;
            $mundialPayments.remoteAuthHost = remoteAuthHost;

            $mundialPayments.init = function () {
                if (!state) {
                    state = (!state ? st() : state);
                    $cookies.put("pState", state);
                }
                //authObject = $cookies.getObject("pAuthObject");
                //if (authObject) {
                //    $mundialPayments.authObject = authObject;
                //    $mundialPayments.executed = true;
                //} else {
                    getToken();
                //}
                return this;
            };

            function getToken(refresh = false) {
                processingRefreshToken = refresh;
                var dataObject = new Object();
                dataObject.client_id = tClientId;
                dataObject.state = state;
                var urlRequest = null;
                var type = null;
                var paramRequest = null;
                if (refresh && authObject && authObject.success) {
                    $mundialPayments.authObject = new Object();
                    $mundialPayments.authObject.success = false;
                    urlRequest = urlRefresh;
                    type = 'POST';
                    dataObject.refresh_token = $mundialPayments.authObject.refresh_token;
                    dataObject.grant_type = 'refresh_token';
                    paramRequest = {
                        url: urlRequest,
                        method: type,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        transformRequest: function (obj) {
                            var str = [];
                            for (var p in obj)
                                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                            console.log(str.join("&"));
                            return str.join("&");
                        },
                        data: dataObject
                    };
                } else {
                    type = 'GET';
                    urlRequest = urlOuth;
                    dataObject.redirect_uri = urlCallback;
                    dataObject.userId = tUserId;
                    dataObject.response_type = 'code';
                    paramRequest = {
                        url: urlRequest,
                        method: type,
                        params: dataObject
                    };
                }
                if (idIntervalAuth != 0) {
                    $interval.cancel(idIntervalAuth);
                    idIntervalAuth = 0;
                }
                $http(paramRequest).then(function (data) {
                    authObject = new Object();
                    authObject.appToken = data.data.access_token;
                    authObject.refresh_token = data.data.refresh_token;
                    authObject.refresh = data.data.refresh;
                    authObject.expires = data.data.expires;
                    authObject.token_type = data.data.token_type;
                    authObject.message = 'Token Obtenido';
                    authObject.success = true;
                    $mundialPayments.authObject = authObject;
                    $mundialPayments.executed = true;
                    //$cookies.putObject("pAuthObject", authObject);
                    processingRefreshToken = false;
                }, function (error) {
                    if (error.status != -1) {
                        if (refresh) {
                            processingRefreshToken = false;
                            getToken();
                        }
                        $mundialPayments.executed = true;
                        authObject.message = 'Error al obtener el Token: ' + error.data.Message;
                        authObject.success = false;
                        $mundialPayments.authObject = authObject;
                        $cookies.remove("pAuthObject");
                        $cookies.remove("pState");
                    } else {
                        if (triesAuth < 5) {
                            idIntervalAuth = $interval(function () {
                                triesAuth += 1;
                                getToken();
                            }, 2000);
                        } else {
                            $mundialPayments.executed = true;
                            authObject.message = 'Se han superado la cantidad de reintentos';
                            authObject.success = false;
                            $mundialPayments.authObject = authObject;
                            triesAuth = 0;
                            $cookies.remove("pAuthObject");
                            $cookies.remove("pState");
                            processingRefreshToken = false;
                        }
                    }
                });
            };

            $mundialPayments.then = function (callback) {
                callback();
                return this;
            }

            $mundialPayments.getConfirmPayment = function (transactionId) {
                $http.defaults.headers.common.Authorization = $mundialPayments.authObject.token_type + ' ' + $mundialPayments.authObject.appToken;
                var dataSend = JSON.stringify(transactionId);
                if (idIntervalCp != 0) {
                    $interval.cancel(idIntervalCp);
                    idIntervalCp = 0;
                }
                $http({
                    url: remoteServiceHost + '/api/pms/GetConfirmPayment',
                    method: 'POST',
                    data: dataSend
                })
                    .then(function (response) {
                        if (response.data.success) {
                            $mundialPayments.voucherPayment = response.data.voucherPayment;
                            $mundialPayments.executed = true;
                            $mundialPayments.isGetConfirmPayment = true;
                        } else {
                            $mundialPayments.executed = true;
                            $mundialPayments.isGetConfirmPayment = false;
                            $mundialPayments.errorMessage = response.data.message;
                        }
                    }, function (error) {
                        if (error.status != -1 && error.status != 401) {
                            $mundialPayments.executed = true;
                            $mundialPayments.isGetConfirmPayment = false;
                            $mundialPayments.errorMessage = error.data.Message;
                        } else {
                            if (error.status == 401) {
                                if (!processingRefreshToken)
                                    getToken(true);
                            } 
                            if (triesCP < 5) {
                                idIntervalCp = $interval(function () {
                                    triesCP += 1;
                                    $mundialPayments.getPaymentMethods();
                                }, 2000);
                            } else {
                                $mundialPayments.executed = true;
                                $mundialPayments.isGetConfirmPayment = false;
                                $mundialPayments.errorMessage = 'Se han superado la cantidad de reintentos';
                                triesCP = 0;
                            }
                        }
                    });
                return this;
            }

            $mundialPayments.getDataConfirm = function (transactionId) {
                $http.defaults.headers.common.Authorization = $mundialPayments.authObject.token_type + ' ' + $mundialPayments.authObject.appToken;
                if (idIntervalDc != 0) {
                    $interval.cancel(idIntervalDc);
                    idIntervalDc = 0;
                }
                $http({
                    url: remoteServiceHost + '/api/pms/GetDataConfirm',
                    method: 'POST',
                    data: JSON.stringify(transactionId)
                })
                    .then(function (response) {
                        if (response.data.success) {
                            $mundialPayments.paymentConfirmResponse = response.data.paymentConfirmResponse;
                            $mundialPayments.executed = true;
                            $mundialPayments.isGetDataConfirmPayment = true;
                        } else {
                            $mundialPayments.executed = true;
                            $mundialPayments.isGetDataConfirmPayment = false;
                            $mundialPayments.errorMessage = response.data.message;
                        }
                    }, function (error) {
                        if (error.status != -1 && error.status != 401) {
                            $mundialPayments.executed = true;
                            $mundialPayments.isGetDataConfirmPayment = false;
                            $mundialPayments.errorMessage = error.data.Message;
                        } else {
                            if (error.status == 401) {
                                if (!processingRefreshToken)
                                    getToken(true);
                            } 
                            if (triesDC < 5) {
                                idIntervalDc = $interval(function () {
                                    triesDC += 1;
                                    $mundialPayments.getPaymentMethods();
                                }, 2000);
                            } else {
                                $mundialPayments.executed = true;
                                $mundialPayments.isGetDataConfirmPayment = false;
                                $mundialPayments.errorMessage = 'Se han superado la cantidad de reintentos';
                                triesDC = 0;
                            }
                        }
                    });
                return this;
            }

            $mundialPayments.getPaymentMethods = function () {
                $http.defaults.headers.common.Authorization = $mundialPayments.authObject.token_type + ' ' + $mundialPayments.authObject.appToken;
                if (idIntervalPm != 0) {
                    $interval.cancel(idIntervalPm);
                    idIntervalPm = 0;
                }
                $http.post(remoteServiceHost + '/api/pms/PaymentMethodsParams')
                    .then(function (response) {
                        if (response.data.success) {
                            $mundialPayments.paymentMethodList = response.data.paymentMethodList;
                            $mundialPayments.executed = true;
                            $mundialPayments.isGetPaymentMethodParams = true;
                        } else {
                            $mundialPayments.executed = true;
                            $mundialPayments.isGetPaymentMethodParams = false;
                            $mundialPayments.errorMessage = response.data.message;
                        }
                    }, function (error) {
                        if (error.status != -1 && error.status != 401) {
                            $mundialPayments.executed = true;
                            $mundialPayments.isGetPaymentMethodParams = false;
                            $mundialPayments.errorMessage = error.data.Message;
                        } else {
                            if (error.status == 401) {
                                if (!processingRefreshToken) {
                                    getToken(true);
                                    var rtInterval = $interval(function () {
                                        if ($mundialPayments.authObject.success) {
                                            $interval.cancel(rtInterval);
                                            $mundialPayments.getPaymentMethods();
                                        }
                                    }, 1000);
                                }
                            } else {
                                if (triesPM < 5) {
                                    idIntervalPm = $interval(function () {
                                        triesPM += 1;
                                        $mundialPayments.getPaymentMethods();
                                    }, 2000);
                                } else {
                                    $mundialPayments.executed = true;
                                    authObject.message = 'Se han superado la cantidad de reintentos';
                                    authObject.success = false;
                                    $mundialPayments.authObject = authObject;
                                    triesPM = 0;
                                }
                            }
                        }
                    });
                return this;
            }
            
            $mundialPayments.alert = function (message) {
                $window.alert(message);
            }

            return $mundialPayments;
        }];

        function st() {
            var ln = rnum(5, 10);
            var charValid = new Array();
            var cmay = new Array(65, 90);
            var cmin = new Array(97, 122);
            var nums = new Array(48, 57);
            var state = '';

            charValid.push(cmay);
            charValid.push(cmin);
            charValid.push(nums);
            var tc;
            for (var i = 0; i < 10; i++) {
                do {
                    tc = rnum(0, charValid.length);
                } while (tc >= charValid.length);
                var asc = rnum(charValid[tc][0], charValid[tc][1])
                state = state + String.fromCharCode(asc);
            }
            return state;
        }

        function rnum(min, max) {
            return Math.round((Math.random() * (max - min)) + min);
        }
    }

    ngMunVoucherConfirmDirective.$inject = ['$mundialPayments', '$interval', '$http'];
    function ngMunVoucherConfirmDirective($mundialPayments, $interval, $http) {
        return {
            restrict: 'E',
            scope: {
                munTransactionId: '='
            },
            link: function (scope, element, attrs) {
                if (scope.munTransactionId == undefined) {
                    scope.styleError = {
                        color: 'red',
                        fontSize: '18px',
                        fontWeight: 'bolder'
                    };
                    var errorText = '<div class="text-center" ng-style="styleError">' +
                        'Ha Ocurrido un error, por favor comuniquese con el administrador' +
                        '</div>';
                    $('#voucherPayment').html(errorText);
                    return;
                }
                scope.imgLoading = $mundialPayments.imgLoading
                scope.isLoading = $mundialPayments.isLoading;
                if ($mundialPayments.imgLoading) {
                    scope.style = {
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        backgroundImage: 'url(' + $mundialPayments.imgLoading + ')',
                        backgroundSize: 'auto 90%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPositionX: 'center',
                        zIndex: '2'
                    };
                }
                $mundialPayments.init()
                    .then(function () {
                        var x = $interval(function () {
                            if ($mundialPayments.executed) {
                                $interval.cancel(x);
                                if ($mundialPayments.authObject.success) {
                                    $mundialPayments.executed = false;
                                    $mundialPayments.getConfirmPayment(scope.munTransactionId)
                                        .then(function () {
                                            var y = $interval(function () {
                                                if ($mundialPayments.executed) {
                                                    $interval.cancel(y);
                                                    if ($mundialPayments.isGetConfirmPayment) {
                                                        $('#voucherPayment').html($mundialPayments.voucherPayment);
                                                        if (attrs.mainClass != undefined) {
                                                            var classes = attrs.mainClass.split(" ");
                                                            $.each(classes, function (index, element) {
                                                                //$('#mainVoucherContainer').addClass(attrs.mainClass);
                                                                $('#mainVoucherContainer').addClass(element);
                                                            });
                                                        }

                                                        if (attrs.classHeader != undefined) {
                                                            var classes = attrs.classHeader.split(" ");
                                                            $.each(classes, function (index, element) {
                                                                //$('#headerVoucher').addClass(attrs.classHeader);
                                                                $('#headerVoucher').addClass(element);
                                                            });
                                                        }
                                                        if (attrs.classSubTitle != undefined) {
                                                            var classes = attrs.classSubTitle.split(" ");
                                                            $.each(classes, function (index1, element) {
                                                                $('.subTitleVoucher').each(function (index) {
                                                                    //$(this).addClass(attrs.classSubTitle);
                                                                    $(this).addClass(element);
                                                                });
                                                            });
                                                        }
                                                        if (attrs.classPreText != undefined) {
                                                            var classes = attrs.classPreText.split(" ");
                                                            $.each(classes, function (index1, element) {
                                                                $('.preTextVoucher').each(function (index) {
                                                                    //$(this).addClass(attrs.classPreText);
                                                                    $(this).addClass(element);
                                                                });
                                                            });
                                                        }
                                                        if (attrs.classTitles != undefined) {
                                                            var classes = attrs.classTitles.split(" ");
                                                            $.each(classes, function (index1, element) {
                                                                $('.titlesVoucher').each(function (index) {                                                                
                                                                    //$(this).addClass(attrs.classTitles);
                                                                    $(this).addClass(element);
                                                                });
                                                            });
                                                        }
                                                        if (attrs.classData != undefined) {
                                                            var classes = attrs.classData.split(" ");
                                                            $.each(classes, function (index1, element) {
                                                                $('.dataVoucher').each(function (index) {                                                                
                                                                    //$(this).addClass(attrs.classData);
                                                                    $(this).addClass(element);
                                                                });
                                                            });
                                                        }
                                                        scope.isLoading = false;
                                                    }
                                                }
                                            },500);
                                        });
                                }
                            }
                        }, 500);
                   });

            },
            template:
                '<div class="row" style="min-height: 100px; position: relative;">' +
                '<div ng-show="isLoading" ng-style="style"></div>' +
                '<div class="col-md-12" id="voucherPayment">' +
                '</div>'+
                '</div>'
        }
    }

    function validarModelo(ngModel, requireUrlConfirmation) {
        var message = "";
        if (ngModel.UserId == undefined) {
            message += "No se ha definido el id de usaurio, por favor definalo.";
        }
        if (ngModel.Currency == undefined) {
            message += "\nNo se ha definido el la moneda de la transacción, por favor definala.";
        }
        if (ngModel.Description == undefined) {
            message += "\nLa descripcion es obligatoria.";
        }
        if (ngModel.TotalAmmount == undefined) {
            message += "\nEl valor total de la transaccion es obligatorio.";
        } else {
            if (ngModel.TotalAmmount <= 0) {
                message += "\nEl valor total de la transaccion debe ser > 0.";
            }
        }
        if (ngModel.Tax == undefined) {
            message += "\nEl valor del Iva es obligatorio, si no lo conoce, definalo en 0.";
        } else {
            if (ngModel.TaxReturnBase != undefined && ngModel.TaxReturnBase > 0 && ngModel.Tax <= 0) {
                message += "\nEl valor del Iva no puede ser inferior o igual 0 cuando existe una base de calculo.";
            }
        }
        if (ngModel.TaxReturnBase == undefined) {
            message += "\nLa base de calculo para el iva es obligatorio, si no lo conoce dejelo en 0.";
        } else {
            if (ngModel.Tax != undefined && ngModel.Tax > 0 && ngModel.TaxReturnBase <= 0) {
                message += "\nLa base de calculo para el iva no puede ser menor o igual a 0 cuando el iva es diferente de 0.";
            }
        }
        if (ngModel.PurchaseId == undefined) {
            message += "\nEl No. de referencia de la compra es obligatorio.";
        }
        if (ngModel.BuyerEmail == undefined) {
            message += "\nEl Email del comprador es obligatorio.";
        }
        if (ngModel.UrlResponse == undefined) {
            message += "\nDebe definir una url de respuesta, es obligatoria.";
        }
        if (requireUrlConfirmation && ngModel.urlConfirmation == undefined) {
            message += "\nEl metodo de pago escogido, requiere una url de confirmación de pago.";
        }
        //if (requireUrlConfirmation && ngModel.idCustomer == undefined) {
        //    message += "\nEl metodo de pago escogido, requiere el numero de identificación del cliente.";
        //}
        //if (requireUrlConfirmation && ngModel.NameCustomer == undefined) {
        //    message += "\nEl metodo de pago escogido, requiere el nombre completo del cliente.";
        //}
        return message;
    }

    ngMunButtonsDirective.$inject = ['$mundialPayments', '$interval', '$http'];
    function ngMunButtonsDirective($mundialPayments, $interval, $http) {
        return {
            restrict: 'E',
            scope: {
                ngModel: '=',
                ngForm: '='
            },
            link: function (scope, element, attrs) {
                scope.imgLoading = $mundialPayments.imgLoading
                scope.isLoading = $mundialPayments.isLoading;
                if ($mundialPayments.imgLoading) {
                    scope.style = {
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        backgroundImage: 'url(' + $mundialPayments.imgLoading + ')',
                        backgroundSize: 'auto 90%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPositionX: 'center',
                        zIndex: '2'
                    };
                }
                $mundialPayments.init()
                    .then(function () {
                        var x = $interval(function () {
                            if ($mundialPayments.executed) {
                                $interval.cancel(x);
                                if ($mundialPayments.authObject.success) {
                                    $mundialPayments.executed = false;
                                    $mundialPayments.getPaymentMethods()
                                        .then(function (values) {
                                            var y = $interval(function () {
                                                if ($mundialPayments.executed) {
                                                    $interval.cancel(y);
                                                    if ($mundialPayments.isGetPaymentMethodParams) {
                                                        scope.paymentMethodList = $mundialPayments.paymentMethodList;
                                                        $.each(scope.paymentMethodList, function (index, element) {
                                                            element.MaxImageHeight = '100px';
                                                            element.MaxImageWidth = Math.round(100 * element.widthImage / element.heightImage) + 'px';
                                                        });
                                                        var cols = 0;
                                                        if (attrs.rowView == undefined) {
                                                            scope.rowView = false;
                                                        }
                                                        else {
                                                            scope.rowView = (attrs.rowView === "true");
                                                            if (scope.rowView) {
                                                                var cantButtons = $mundialPayments.paymentMethodList.length;
                                                                cols = Math.floor(12 / cantButtons);
                                                                if (cols < 1)
                                                                    cols = 1;
                                                            }
                                                        }
                                                        scope.styles = {
                                                            'col-md-1': (cols === 1),
                                                            'col-md-2': (cols === 2),
                                                            'col-md-3': (cols === 3),
                                                            'col-md-4': (cols === 4),
                                                            'col-md-5': (cols === 5),
                                                            'col-md-6': (cols === 6),
                                                            'col-md-7': (cols === 7),
                                                            'col-md-8': (cols === 8),
                                                            'col-md-9': (cols === 9),
                                                            'col-md-10': (cols === 10),
                                                            'col-md-11': (cols === 11),
                                                            'col-md-12': (cols === 12),

                                                            'col-sm-1': (cols === 1),
                                                            'col-sm-2': (cols === 2),
                                                            'col-sm-3': (cols === 3),
                                                            'col-sm-4': (cols === 4),
                                                            'col-sm-5': (cols === 5),
                                                            'col-sm-6': (cols === 6),
                                                            'col-sm-7': (cols === 7),
                                                            'col-sm-8': (cols === 8),
                                                            'col-sm-9': (cols === 9),
                                                            'col-sm-10': (cols === 10),
                                                            'col-sm-11': (cols === 11),
                                                            'col-sm-12': (cols === 12),

                                                            'col-xs-1': (cols === 1),
                                                            'col-xs-2': (cols === 2),
                                                            'col-xs-3': (cols === 3),
                                                            'col-xs-4': (cols === 4),
                                                            'col-xs-5': (cols === 5),
                                                            'col-xs-6': (cols === 6),
                                                            'col-xs-7': (cols === 7),
                                                            'col-xs-8': (cols === 8),
                                                            'col-xs-9': (cols === 9),
                                                            'col-xs-10': (cols === 10),
                                                            'col-xs-11': (cols === 11),
                                                            'col-xs-12': (cols === 12)
                                                        }

                                                        scope.sendDataError = false;
                                                        scope.processPayment = function (idPayment) {
                                                            scope.isLoading = true;
                                                            if (scope.ngModel == undefined) {
                                                                scope.messageError = "Ha ocurrido un error al enviar el pago, por favor comuniquelo al administrador del sistema";
                                                                console.log("No se ha definido ningun modelo para procesar")
                                                                scope.sendDataError = true;
                                                                scope.isLoading = false;
                                                                return;
                                                            }
                                                            var paymentMethodSelected = null;
                                                            $.each(scope.paymentMethodList, function (index, element) {
                                                                if (element.idPaymentMethod == idPayment) {
                                                                    paymentMethodSelected = element;
                                                                }
                                                            });
                                                            scope.ngModel.TypePaymentMethod = paymentMethodSelected.typePaymentMethod;
                                                            scope.ngModel.PaymentMethod = paymentMethodSelected.paymentMethod;

                                                            var message = validarModelo(scope.ngModel, paymentMethodSelected.requireUrlConfirmation);
                                                            if (message.length > 0) {
                                                                scope.messageError = "Ha ocurrido un error al enviar el pago, por favor comuniquelo al administrador del sistema";
                                                                console.log(message);
                                                                scope.sendDataError = true;
                                                                scope.isLoading = false;
                                                                return;
                                                            }

                                                            $http.defaults.headers.common.Authorization = $mundialPayments.authObject.token_type + ' ' + $mundialPayments.authObject.appToken;
                                                            var urlRequest = $mundialPayments.remoteServiceHost + '/api/pms/ProcessPayment';
                                                            var dataObject = JSON.stringify(scope.ngModel);
                                                            $http({
                                                                url: urlRequest,
                                                                method: 'POST',
                                                                data: dataObject
                                                            })
                                                                .then(function (response) {
                                                                    if(response.data.success) {
                                                                        if(attrs.ngForm == undefined) {
                                                                            $('#loadFormRedirect').html(response.data.data);
                                                                            $('#enviarPago').click();
                                                                        } else {
                                                                            $('#' + attrs.ngForm).prop("method", 'POST');
                                                                            $('#' + attrs.ngForm).prop("action", response.data.url);
                                                                            $('#' + attrs.ngForm).append(response.data.dataSend);
                                                                            $('#' + attrs.ngForm).submit();
                                                                        }
                                                                    } else {
                                                                        scope.sendDataError = true;
                                                                        scope.messageError = "Ha ocurrido un error al enviar el pago, por favor intentelo mas tarde";
                                                                        scope.isLoading = false;
                                                                        console.log(response.data.Message);
                                                                    }
                                                                }, function (error) {
                                                                    scope.sendDataError = true;
                                                                    scope.messageError = "Ha ocurrido un error al enviar el pago, por favor intentelo mas tarde";
                                                                    scope.isLoading = false;
                                                                    console.log(error.Message);
                                                                });
                                                        }
                                                        scope.shPse = $mundialPayments.shPse;
                                                        scope.shTc = $mundialPayments.shTc;
                                                        scope.tcImg = $mundialPayments.tcImg;
                                                        scope.pseImg = $mundialPayments.pseImg;
                                                        scope.mundialServiceError = ($mundialPayments.executed && !$mundialPayments.isGetPaymentMethodParams && !$mundialPayments.authObject.success);
                                                        if (scope.isLoading) {
                                                            scope.isLoading = false;
                                                        }
                                                    } else {
                                                        scope.mundialServiceError = true;
                                                        if (scope.isLoading) {
                                                            scope.isLoading = false;
                                                        }
                                                    }
                                                }
                                                return false;
                                            }, 500);
                                            return false;
                                        });
                                } else {
                                    scope.mundialServiceError = true;
                                    if (scope.isLoading) {
                                        scope.isLoading = false;
                                    }
                                }
                            }
                            return false;
                        }, 500);
                        return false;
                    });
                return false;
            },
            template:
                //'<div style="min-height:200px; max-height:500px; position: relative;">' +
                '<div style="position: relative; min-height:50px;">' +
                    '<div id="loadFormRedirect" ></div>' +
                    '<div ng-show="isLoading" ng-style="style"></div>' +
                    '<div ng-show="!mundialServiceError">' +
                        '<div class="row">'+
                            '<div ng-repeat="paymentMethod in paymentMethodList">' +
                                '<div class="text-center" ng-class="styles">' +
                                    '<button style="background-color: rgba(0,0,0,0); border:0px;" ng-click="processPayment(paymentMethod.idPaymentMethod)" onclick="return false;">' +
                                        //'<img width="{{paymentMethod.MaxImageWidth}}" height="{{paymentMethod.MaxImageHeight}}" src="{{paymentMethod.byteImage}}" />' +
                                        '<img class="col-md-12 col-sm-12 col-xs-12" src="{{paymentMethod.byteImage}}" />' + 
                                    '</button>' +
                                '</div>'+
                            '</div>' +
                        '</div>'+
                    '</div>' +
                    '<div ng-show="sendDataError">' +
                        '<div style="color:red; font-weight:bolder; font-size:18px;">{{messageError}}</div>' +
                    '</div>'+
                    '<div ng-show="mundialServiceError">' +
                        '<div style="color:red; font-weight:bolder; font-size:18px;">Ha ocurrido un error, por favor intentelo mas tarde o comuniquese con el administrador</div>' +
                    '</div>' +
                '</div>'               
        };
    }

    ngMunConfirmPaymentDirective.$inject = ['$mundialPayments', '$interval', '$http'];
    function ngMunConfirmPaymentDirective($mundialPayments, $interval, $http) {
        return {
            required: ['form', 'nameButton', 'munTransactionId'],
            restrict: 'E',
            scope: {
                munTransactionId: '='
            },
            link: function (scope, element, attrs) {
                $mundialPayments.init()
                    .then(function () {
                        var x = $interval(function () {
                            if ($mundialPayments.executed) {
                                $interval.cancel(x);
                                if ($mundialPayments.authObject.success) {
                                    $mundialPayments.executed = false;
                                    if (attrs.form == undefined) {
                                        $mundialPayments.alert("Debe incluir el formulario");
                                        return;
                                    }
                                    if (attrs.nameButton == undefined) {
                                        $mundialPayments.alert("Debe incluir el nombre del boton");
                                        return;
                                    } else {
                                        scope.textButton = attrs.nameButton;
                                    }

                                    if (scope.munTransactionId == undefined) {
                                        $mundialPayments.alert("Debe incluir el id de Transaccion");
                                        return;
                                    }

                                    if (attrs.classButton != undefined) {
                                        var classes = attrs.classButton.split(" ");
                                        $.each(classes, function (index, elm) {
                                            $('#reqConfirmPaymentButton').addClass(elm);
                                        });
                                    }
                                    scope.requestProcess = function () {
                                        $mundialPayments.getDataConfirm(scope.munTransactionId)
                                            .then(function () {
                                                var y = $interval(function () {
                                                    if ($mundialPayments.executed) {
                                                        $interval.cancel(y);
                                                        if ($mundialPayments.isGetDataConfirmPayment) {
                                                            var inputs = new Array();
                                                            inputs.push('<input type="hidden" id="idRecaudo" name="idRecaudo" value="' + $mundialPayments.paymentConfirmResponse.idRecaudo + '" />');
                                                            inputs.push('<input type="hidden" id="transactionState" name="transactionState" value="' + $mundialPayments.paymentConfirmResponse.transactionState + '" />');
                                                            inputs.push('<input type="hidden" id="message" name="message" value="' + $mundialPayments.paymentConfirmResponse.message + '" />');
                                                            inputs.push('<input type="hidden" id="reference_sale" name="reference_sale" value="' + $mundialPayments.paymentConfirmResponse.reference_sale + '" />');
                                                            inputs.push('<input type="hidden" id="reference_pol" name="reference_pol" value="' + $mundialPayments.paymentConfirmResponse.reference_pol + '" />');
                                                            inputs.push('<input type="hidden" id="payment_method_name" name="payment_method_name" value="' + $mundialPayments.paymentConfirmResponse.payment_method_name + '" />');
                                                            inputs.push('<input type="hidden" id="date" name="date" value="' + $mundialPayments.paymentConfirmResponse.date + '" />');
                                                            inputs.push('<input type="hidden" id="pse_bank" name="pse_bank" value="' + $mundialPayments.paymentConfirmResponse.pse_bank + '" />');
                                                            inputs.push('<input type="hidden" id="bank_id" name="bank_id" value="' + $mundialPayments.paymentConfirmResponse.bank_id + '" />');
                                                            inputs.push('<input type="hidden" id="cod_pse" name="cod_pse" value="' + $mundialPayments.paymentConfirmResponse.cod_pse + '" />');
                                                            inputs.push('<input type="hidden" id="codRespuesta" name="codRespuesta" value="' + $mundialPayments.paymentConfirmResponse.codRespuesta + '" />');
                                                            $.each(inputs, function (index, elm) {
                                                                $('#' + attrs.form).append(elm);
                                                            });
                                                            $('#' + attrs.form).submit();
                                                        } else {
                                                            //$mundialPayments.alert("Ha ocurrido un error al intentar actualizar el pago, por favor intentelo mas tarde");
                                                        }
                                                    } else {
                                                        //$mundialPayments.alert("Ha ocurrido un error al intentar actualizar el pago, por favor intentelo mas tarde");
                                                    }
                                                    return false;
                                                }, 500);
                                                return false;
                                            });
                                    }
                                } else {
                                    //$mundialPayments.alert("Ha ocurrido un error al intentar actualizar el pago, por favor intentelo mas tarde");
                                }
                            }
                            return false;
                        }, 500);
                        return false;
                    });
                return false;
            },
            template:
                '<a ng-click="requestProcess()" id="reqConfirmPaymentButton">{{textButton}}</a>' 
        }
    }
})(window, window.angular);
