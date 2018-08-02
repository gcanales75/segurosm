//adminPaymentsApp.controller('homeController', function ($scope, $location, $interval, $login) {
adminPaymentsApp.controller('homeController', function ($scope, $location, $interval) {
    $scope.welcome = "Bienvenido a la Herramienta de Administración de Usuarios";
    //$scope.isAutenticated = $login.isAutenticated;
    //var x = $interval(function () {
    //    if ($scope.isAutenticated !== $login.isAutenticated) {
    //        $scope.isAutenticated = $login.isAutenticated;
    //    }
    //}, 100);
    //$scope.login = function () {
    //    $login.login();
    //};    
});

adminPaymentsApp.controller('usersController', function ($scope, $location, $http, $login, $interval) {
    //$scope.isAutenticated = $login.isAutenticated;
    //if (!$login.isAutenticated) {
    //    $location.path("/");
    //}

    //var x = $interval(function () {
    //    if ($scope.isAutenticated !== $login.isAutenticated) {
    //        $scope.isAutenticated = $login.isAutenticated;
    //    }
    //}, 100);

    $scope.indexRoleSelected = -1;
    $scope.indexRoleUserSelected = -1;
    function getUsers() {
        $http({
            url: '/Administrator/GetUsers',
            method: 'POST'
        }).then(function (response) {
            if (response.data.success) {
                $scope.lstUsers = response.data.lstUsers;
            } else {
                $scope.lstUsers = new Array();
            }
        }, function (error) {
            console.error(error.message);
            $scope.lstUsers = new Array();
        });
    }
    getUsers();

    function getRoles(user = null) {
        var data = new Object();
        data.user = user;
        $http({
            url: '/Administrator/GetRoles',
            method: 'POST',
            data: JSON.stringify(data)
        }).then(function (response) {
            if (response.data.success) {
                $scope.lstRoles = response.data.lstRoles;
            } else {
                $scope.lstRoles = new Array();
            }
        }, function (error) {
            console.error(error.message);
            $scope.lstRoles = new Array();
        });
    };
    
    function getClients() {
        $http({
            url: '/Administrator/GetAppClients',
            method: 'POST'
        }).then(function (response) {
            if (response.data.success) {
                $scope.lstClients = response.data.lstClients;
            } else {
                $scope.lstClients = new Array();
            }
        }, function (error) {
            console.error(error.message);
            $scope.lstClients = new Array();
        });
    }
    getClients();


    $scope.crearUsuario = function () {
        $scope.modalTitle = "Crear Usuario";
        $scope.modalTemplate = "/templates/userForm.html";
        $scope.modalButtonCancel = "Cancelar";
        $scope.modalButtonProcess = "Crear Usuario";
        $scope.nUser = new Object();
        $scope.nUser.RolesUser = new Array();
        $scope.codeProcess = 0;
        getRoles();
        $scope.indexRoleSelected = -1;
        $scope.indexRoleUserSelected = -1;
    };

    $scope.editarUsuario = function (index) {
        $scope.modalTitle = "Editar Usuario";
        $scope.modalTemplate = "/templates/userForm.html";
        $scope.modalButtonCancel = "Cancelar";
        $scope.modalButtonProcess = "Procesar";
        $scope.nUser = $scope.lstUsers[index];
        $scope.codeProcess = 1;
        getRoles($scope.nUser);
        $scope.indexRoleSelected = -1;
        $scope.indexRoleUserSelected = -1;    
    }

    $scope.changeApp = function () {
        $.each($scope.lstClients, function (index, element) {
            if (element.Name === $scope.nUser.ClientId) {
                $scope.nUser.appClient = element;
            }
        });
    }

    $scope.ItemRoleSelect = function (index) {
        $scope.indexRoleSelected = index;
    }

    $scope.indexRoleUserSelect = function (index) {
        $scope.indexRoleUserSelected = index;
    }

    $scope.addRole = function () {
        var roleSelected = $scope.lstRoles[$scope.indexRoleSelected];
        $scope.nUser.RolesUser.push(roleSelected);
        $scope.lstRoles.splice($scope.indexRoleSelected, 1);
        $scope.indexRoleSelected = -1;
        $scope.indexRoleUserSelected = -1;
    }

    $scope.removeRole = function () {
        var roleSelected = $scope.nUser.RolesUser[$scope.indexRoleUserSelected];
        $scope.lstRoles.push(roleSelected);
        $scope.nUser.RolesUser.splice($scope.indexRoleUserSelected, 1);
        $scope.indexRoleSelected = -1;
        $scope.indexRoleUserSelected = -1;
    }

    $scope.eliminarUsuario = function (index) {
        $scope.nUser = $scope.lstUsers[index];
        if (confirm('Esta Seguro que desea eliminar el usuario "' + $scope.nUser.UserName + '"?')) {
            $http({
                url: '/Administrator/DeleteUser',
                method: 'POST',
                data: $scope.nUser
            }).then(function (response) {
                $scope.nRole = new Object();
                getUsers();
                alert(response.data.message);
            }, function (error) {
                $scope.nRole = new Object();
                getUsers();
                alert("Ha ocurrido un error, por favor intentelo de nuevo");
            });
        }
    }

    $scope.procesar = function () {
        if ($scope.codeProcess === 0) {
            $http({
                url: '/Administrator/CreateUser',
                method: 'POST',
                data: $scope.nUser
            }).then(function (response) {
                $scope.nUser = new Object();
                getUsers();
                $("#modalForms").modal('toggle');
                alert(response.data.message);
            }, function (error) {
                $scope.nUser = new Object();
                getUsers();
                $("#modalForms").modal('toggle');
                alert("Ha ocurrido un error, por favor intentelo de nuevo");
            });
        }
        else {
            if ($scope.codeProcess === 1) {
                $http({
                    url: '/Administrator/UpdateUser',
                    method: 'POST',
                    data: $scope.nUser
                }).then(function (response) {
                    $scope.nUser = new Object();
                    getRoles();
                    $("#modalForms").modal('toggle');
                    alert(response.data.message);
                }, function (error) {
                    $scope.nUser = new Object();
                    getRoles();
                    $("#modalForms").modal('toggle');
                    alert("Ha ocurrido un error, por favor intentelo de nuevo");
                });
            }
        }
    }
});

adminPaymentsApp.controller('rolesController', function ($scope, $location, $http, $login, $interval) {
    //$scope.isAutenticated = $login.isAutenticated;
    //if (!$login.isAutenticated) {
    //    $location.path("/");
    //}

    //var x = $interval(function () {
    //    if ($scope.isAutenticated !== $login.isAutenticated) {
    //        $scope.isAutenticated = $login.isAutenticated;
    //    }
    //}, 100);

    function getRoles() {
        var data = new Object();
        data.user = null;
        $http({
            url: '/Administrator/GetRoles',
            method: 'POST',
            data: JSON.stringify(data)
        }).then(function (response) {
            if (response.data.success) {
                $scope.lstRoles = response.data.lstRoles;
            } else {
                $scope.lstRoles = new Array();
            }
        }, function (error) {
            console.error(error.message);
            $scope.lstRoles = new Array();
        });
    };

    getRoles();

    $scope.crearRol = function () {
        $scope.modalTitle = "Crear Rol";
        $scope.modalTemplate = "/templates/roleForm.html";
        $scope.modalButtonCancel = "Cancelar";
        $scope.modalButtonProcess = "Crear Rol";
        $scope.nRole = new Object();
        $scope.codeProcess = 0;
    };

    $scope.editarRol = function (index) {
        $scope.modalTitle = "Editar Rol";
        $scope.modalTemplate = "/templates/roleForm.html";
        $scope.modalButtonCancel = "Cancelar";
        $scope.modalButtonProcess = "Procesar";
        $scope.nRole = $scope.lstRoles[index];
        $scope.codeProcess = 1;
    }

    $scope.eliminarRol = function (index) {
        $scope.nRole = $scope.lstRoles[index];
        if (confirm('Esta Seguro que desea eliminar el rol "' + $scope.nRole.Name + '"?')) {
            $http({
                url: '/Administrator/DeleteRole',
                method: 'POST',
                data: $scope.nRole
            }).then(function (response) {
                $scope.nRole = new Object();
                getRoles();
                alert(response.data.message);
            }, function (error) {
                $scope.nRole = new Object();
                getRoles();
                alert("Ha ocurrido un error, por favor intentelo de nuevo");
            });
        }
    }
    

    $scope.procesar = function () {
        if ($scope.codeProcess === 0) {
            $http({
                url: '/Administrator/CreateRole',
                method: 'POST',
                data: $scope.nRole
            }).then(function (response) {
                $scope.nRole = new Object();
                getRoles();
                $("#modalForms").modal('toggle');
                alert(response.data.message);
            }, function (error) {
                $scope.nRole = new Object();
                getRoles();
                $("#modalForms").modal('toggle');
                alert("Ha ocurrido un error, por favor intentelo de nuevo");
            });
        }
        else {
            if ($scope.codeProcess === 1) {
                $http({
                    url: '/Administrator/UpdateRole',
                    method: 'POST',
                    data: $scope.nRole
                }).then(function (response) {
                    $scope.nRole = new Object();
                    getRoles();
                    $("#modalForms").modal('toggle');
                    alert(response.data.message);
                }, function (error) {
                    $scope.nRole = new Object();
                    getRoles();
                    $("#modalForms").modal('toggle');
                    alert("Ha ocurrido un error, por favor intentelo de nuevo");
                });
            }
        }
    }
});

adminPaymentsApp.controller('appClientsController', function ($scope, $location, $http, $login, $interval) {
    //$scope.isAutenticated = $login.isAutenticated;
    //if (!$login.isAutenticated) {
    //    $location.path("/");
    //}

    //var x = $interval(function () {
    //    if ($scope.isAutenticated !== $login.isAutenticated) {
    //        $scope.isAutenticated = $login.isAutenticated;
    //    }
    //}, 100);

    function getClients() {
        $http({
            url: '/Administrator/GetAppClients',
            method: 'POST'
        }).then(function (response) {
            if (response.data.success) {
                $scope.lstClients = response.data.lstClients;
            } else {
                $scope.lstClients = new Array();
            }
        }, function (error) {
            console.error(error.message);
            $scope.lstClients = new Array();
        });
    }

    getClients();

    $scope.crearAppClients = function () {
        $scope.modalTitle = "Crear Aplicación Cliente";
        $scope.modalTemplate = "/templates/appClientForm.html";
        $scope.modalButtonCancel = "Cancelar";
        $scope.modalButtonProcess = "Crear Aplicación";
        $scope.nAppClient = new Object();
        $scope.block = false;
        $scope.nAppClient.Active = !$scope.block;
        $scope.codeProcess = 0;
    };

    $scope.editarAppClients = function (index) {
        $scope.modalTitle = "Editar Aplicación Cliente";
        $scope.modalTemplate = "/templates/appClientForm.html";
        $scope.modalButtonCancel = "Cancelar";
        $scope.modalButtonProcess = "Procesar";
        $scope.nAppClient = $scope.lstClients[index];
        $scope.block = !$scope.nAppClient.Active;
        //$scope.nAppClient.Active = !$scope.block;
        $scope.codeProcess = 1;
    }

    $scope.eliminarAppClients = function (index) {
        $scope.nAppClient = $scope.lstClients[index];
        if (confirm('Esta Seguro que desea eliminar el Cliente "' + $scope.nAppClient.Name + '"?')) {
            $http({
                url: '/Administrator/DeleteAppClient',
                method: 'POST',
                data: $scope.nAppClient
            }).then(function (response) {
                $scope.nAppClient = new Object();
                getClients();
                alert(response.data.message);
            }, function (error) {
                $scope.nAppClient = new Object();
                getClients();
                alert("Ha ocurrido un error, por favor intentelo de nuevo");
            });
        }
    }


    $scope.procesar = function () {
        if ($scope.codeProcess === 0) {
            $http({
                url: '/Administrator/CreateAppClient',
                method: 'POST',
                data: $scope.nAppClient
            }).then(function (response) {
                $scope.nAppClient = new Object();
                getClients();
                $("#modalForms").modal('toggle');
                alert(response.data.message);
            }, function (error) {
                $scope.nAppClient = new Object();
                getClients();
                $("#modalForms").modal('toggle');
                alert("Ha ocurrido un error, por favor intentelo de nuevo");
            });
        }
        else {
            if ($scope.codeProcess === 1) {
                $http({
                    url: '/Administrator/UpdateAppClient',
                    method: 'POST',
                    data: $scope.nAppClient
                }).then(function (response) {
                    $scope.nAppClient = new Object();
                    getClients();
                    $("#modalForms").modal('toggle');
                    alert(response.data.message);
                }, function (error) {
                    $scope.nAppClient = new Object();
                    getClients();
                    $("#modalForms").modal('toggle');
                    alert("Ha ocurrido un error, por favor intentelo de nuevo");
                });
            }
        }
    }

    $scope.generateClientId = function () {
        $http.post('/Administrator/GenerateClientId')
            .then(function (response) {
                if (response.data.success) {
                    $scope.nAppClient.Id = response.data.clientId;
                }
            }, function (error) {
                console.error(error.message);
            })
    }

    $scope.generateSecret = function () {
        var key = prompt("Ingrese Palabra Clave");
        var data = new Object();
        data.key = key;
        $http({
            url: '/Administrator/GenerateSecretId',
            method: 'POST',
            data: JSON.stringify(data)
        })
            .then(function (response) {
                if (response.data.success) {
                    $scope.nAppClient.Secret = response.data.secret;
                }
            }, function (error) {
                console.error(error.message);
            })
    }
});

//adminPaymentsApp.controller('navegacionController', function ($scope, $location, $login, $interval) {
adminPaymentsApp.controller('navegacionController', function ($scope, $location, $interval) {
    //$scope.isAutenticated = $login.isAutenticated;

    //var x = $interval(function () {
    //    if ($scope.isAutenticated !== $login.isAutenticated) {
    //        $scope.isAutenticated = $login.isAutenticated;
    //    }
    //}, 100);

    $scope.esActivo = function (rutaActual) {
        return (rutaActual === $location.path());
    }
});

adminPaymentsApp.controller('loginController', function ($scope, $location) {
    var windowHeight = window.innerHeight* 0.8;
    var topDiv = $("#mainLogin").position().top;
    $scope.mainStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: (windowHeight - topDiv) + 'px'
    };

    $scope.formStyle = {
        border: '1px solid #009ADA',
        borderRadius: '5%',
        paddingTop: '10px'
    };
});