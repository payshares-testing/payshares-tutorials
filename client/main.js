var myApp = angular.module('myApp', []);

// Level 1 - Create a Stellar Address
function CreateStellarAddressCtrl($scope, $rootScope, Server, $location, $anchorScroll) {
    $scope.generate = function () {
        $scope.data = {};
        // PASTE CODE HERE
        var keypair = StellarLib.Keypair.random();
        $scope.data.keypair = {
            address: keypair.address(),
            secret: keypair.seed()
        };
    }

    $scope.createAccount = function () {
        Server.friendbot($scope.data.keypair.address)
            .then(function () {
                $scope.$apply(function () {
                    $scope.data.friendbotresult = "Created!";
                });
            })
            .catch(function (err) {
                $scope.$apply(function () {
                    $scope.data.result = err;
                });
            });
    }

    $scope.storeAccount = function () {
        $rootScope.$broadcast("storeaccount",
            $scope.data.name, $scope.data.keypair.address, $scope.data.keypair.secret);
        $location.hash('accountmanager');
        $anchorScroll();
        $scope.data = {};
    }
}
myApp.controller("CreateStellarAddressCtrl", CreateStellarAddressCtrl);

function AccountManagerCtrl($scope, $rootScope, $location, $anchorScroll) {
    $scope.accounts = [{
        name: "root",
        keypair: {
            address: "gspbxqXqEUZkiCCEFFCN9Vu4FLucdjLLdLcsV6E82Qc1T7ehsTC",
            secret: "sft74k3MagHG6iF36yeSytQzCCLsJ2Fo9K4YJpQCECwgoUobc4v"
        }
    }];

    $scope.storeAccount = function (name, account) {
        storeAccount($scope.data.name, $scope.data.address, $scope.data.secret);
        $scope.data = {};
    }

    $scope.$on("storeaccount", function (event, name, address, secret) {
        storeAccount(name, address, secret);
    });

    function storeAccount(name, address, secret) {
        $scope.accounts.push({
            name: name,
            keypair: {
                address: address,
                secret: secret
            }
        });
    }

    $scope.sendPayment = function (account) {
        $rootScope.$broadcast("sendpayment", account.keypair);
        $location.hash('payment');
        $anchorScroll();
    }

    $scope.viewAccount = function (account) {
        $rootScope.$broadcast("viewaccount", account.keypair);
        $location.hash('viewaccount');
        $anchorScroll();
    }

    $scope.addTrust = function (account) {
        $rootScope.$broadcast("addtrust", account.keypair);
        $location.hash('addtrust');
        $anchorScroll();
    }

    $scope.createOffer = function (account) {
        $rootScope.$broadcast("createoffer", account.keypair);
        $location.hash('createoffer');
        $anchorScroll();
    }
}
myApp.controller("AccountManagerCtrl", AccountManagerCtrl);

// Level 2 - View Stellar Account Info
function ViewAccountInfoCtrl($scope, Server) {
    $scope.data = {};

    $scope.$on("viewaccount", function (event, keypair) {
        $scope.data.address = keypair.address;
    });

    $scope.viewAccountInfo = function () {
        // PASTE CODE HERE
        Server.accounts($scope.data.address)
            .then(function (account) {
                $scope.$apply(function () {
                    $scope.data.result = angular.toJson(account, true);
                });
            })
            .catch(StellarLib.NotFoundError, function (err) {
                $scope.$apply(function () {
                    $scope.data.result = "Account not found.";
                });
            })
            .catch(function (err) {
                $scope.$apply(function () {
                    $scope.data.result = err;
                });
            })
    }
}
myApp.controller("ViewAccountInfoCtrl", ViewAccountInfoCtrl);

// Level 3 - Send a Payment
function SendPaymentCtrl($scope, Server) {
    $scope.data = {};

    $scope.$on("sendpayment", function (event, keypair) {
        $scope.data.address = keypair.address;
        $scope.data.secret = keypair.secret;
    });

    $scope.sendPayment = function () {
        sendPayment($scope.data);
    }

    function sendPayment(data) {
        Server.loadAccount(data.address)
        .then(function (account) {
            var transaction = new StellarLib.TransactionBuilder(account, {
                    memo: StellarLib.Memo.text(data.memo)
                })
                .addOperation(StellarLib.Operation.payment({
                    destination: $scope.data.destination,
                    currency: new StellarLib.Currency(data.currency, data.issuer),
                    amount: $scope.data.amount
                }))
                .addSigner(StellarLib.Keypair.fromSeed(data.secret))
                .build();
                console.log(transaction);
            return Server.submitTransaction(transaction);
        })
        .then(function (result) {
            $scope.$apply(function () {
                $scope.data.result = angular.toJson({
                    feeCharged: result.feeCharged,
                    result: result.result
                }, true);
            });
        })
        .catch(function (err) {
            $scope.$apply(function () {
                $scope.data.result = err;
            });
        });
    }
}
myApp.controller("SendPaymentCtrl", SendPaymentCtrl);

// Level 4 - Create a Trust Line
function CreateTrustLineCtrl($scope, Server) {
    $scope.data = {};

    $scope.$on("addtrust", function (event, keypair) {
        $scope.data.address = keypair.address;
        $scope.data.secret = keypair.secret;
    });

    $scope.createTrustLine = function () {
        Server.loadAccount($scope.data.address)
        .then(function (account) {
            return new StellarLib.TransactionBuilder(account)
                .addOperation(StellarLib.Operation.changeTrust({
                    currency: new StellarLib.Currency($scope.data.currency, $scope.data.issuer)
                }))
                .addSigner(StellarLib.Keypair.fromSeed($scope.data.secret))
                .build();
        })
        .then(function (transaction) {
            console.log(transaction);
            return Server.submitTransaction(transaction);
        })
        .then(function (result) {
            $scope.$apply(function () {
                $scope.data.result = angular.toJson({
                    feeCharged: result.feeCharged,
                    result: result.result
                }, true);
            });
        })
        .catch(function (err) {
            $scope.$apply(function () {
                $scope.data.result = err;
            });
        });
    }
};
myApp.controller("CreateTrustLineCtrl", CreateTrustLineCtrl);

function StreamAccountTransactionsCtrl($scope, Server) {
    $scope.data = {};
    var es = null;

    $scope.streamTransactions = function () {
        if (es != null) {
            es.close();
        }
        $scope.data.transactions = [];
        es = Server.accounts($scope.data.address, "transactions", {
            streaming: {
                onmessage: onTransaction
            }
        });
    }

    var onTransaction = function (transaction) {
        $scope.$apply(function () {
            $scope.data.transactions.push(angular.toJson(transaction, true));
        });
    }
}
myApp.controller("StreamAccountTransactionsCtrl", StreamAccountTransactionsCtrl);

function CreateOfferCtrl($scope) {
    $scope.data = {
        buy: {},
        sell: {}
    };

    $scope.$on("createoffer", function (event, keypair) {
        $scope.data.address = keypair.address;
        $scope.data.secret = keypair.secret;
    });

    $scope.createOffer = function () {
        Server.loadAccount($scope.data.address)
        .then(function (account) {
            return new StellarLib.TransactionBuilder(account)
                .addOperation(StellarLib.Operation.createOffer({
                    takerGets: new StellarLib.Currency($scope.data.sell.currency, $scope.data.sell.issuer),
                    takerPays: new StellarLib.Currency($scope.data.buy.currency, $scope.data.buy.issuer),
                    amount: $scope.data.amount,
                    price: $scope.data.price,
                    offerId: $scope.data.offerId
                }))
                .addSigner(StellarLib.Keypair.fromSeed($scope.data.secret))
                .build();
        })
        .then(function (transaction) {
            return Server.submitTransaction(transaction);
        })
        .then(function (result) {
            $scope.$apply(function () {
                $scope.data.result = angular.toJson({
                    feeCharged: result.feeCharged,
                    result: result.result
                }, true);
            });
        })
        .catch(function (err) {
            $scope.$apply(function () {
                $scope.data.result = err;
            });
        });
    }
}
myApp.controller("CreateOfferCtrl", CreateOfferCtrl);

// PASTE HORIZON HOST AND PORT HERE
myApp.value("HORIZON_HOST", "horizon-testnet.stellar.org")
myApp.value("HORIZON_PORT", 443)
// Helper service that holds the server connection
function Server(HORIZON_HOST, HORIZON_PORT) {
    return new StellarLib.Server({
        hostname:HORIZON_HOST,
        port:HORIZON_PORT,
        secure: true
    });
}
myApp.service("Server", Server);