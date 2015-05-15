var myApp = angular.module('myApp', []);

// Level 1 - Create a Stellar Address
function CreateStellarAddressCtrl($scope) {
    $scope.generate = function () {
        // PASTE CODE HERE
        var keypair = StellarLib.Keypair.random();
        $scope.result = angular.toJson({
            address: keypair.address(),
            secret: keypair.seed()
        }, true);
    }
}
myApp.controller("CreateStellarAddressCtrl", CreateStellarAddressCtrl);

// Level 2 - View Stellar Account Info
function ViewAccountInfoCtrl($scope, Server) {
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
                    $scope.data.result = angular.toJson(err, true);
                });
            })
    }
}
myApp.controller("ViewAccountInfoCtrl", ViewAccountInfoCtrl);

function FriendbotCtrl($scope, Server) {
    $scope.createAccount = function () {
        Server.friendbot($scope.data.address)
            .then(function () {
                $scope.$apply(function () {
                    $scope.data.result = "Created!";
                });
            })
            .catch(function (err) {
                $scope.$apply(function () {
                    $scope.data.result = angular.toJson(err, true);
                });
            })
    }
};
myApp.controller("FriendbotCtrl", FriendbotCtrl);

// Level 3 - Send a Payment
function SendPaymentCtrl($scope, Server) {
    $scope.data = {
        address: "gspbxqXqEUZkiCCEFFCN9Vu4FLucdjLLdLcsV6E82Qc1T7ehsTC",
        secret: "sft74k3MagHG6iF36yeSytQzCCLsJ2Fo9K4YJpQCECwgoUobc4v",
        sequence: "",
        destination: "gnLeaAhy4i4qXAjQn7gRSNW7kJ3NF5hv5PaXb2gKnYtsvSgYgg",
        currency: "XLM",
        issuer: "",
        amount: "10000000",
        memo: "This is a text memo"
    };
    $scope.sendPayment = function () {
        Server.loadAccount($scope.data.address)
        .then(function (account) {
            return new StellarLib.TransactionBuilder(account, {
                    memo: StellarLib.Memo.text($scope.data.memo)
                })
                .addOperation(StellarLib.Operation.payment({
                    destination: $scope.data.destination,
                    currency: new StellarLib.Currency($scope.data.currency, $scope.data.issuer),
                    amount: $scope.data.amount
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
                $scope.data.result = angular.toJson(err, true);
            });
        });
    }
}
myApp.controller("SendPaymentCtrl", SendPaymentCtrl);

// Level 4 - Create a Trust Line
function CreateTrustLineCtrl($scope, Server) {
    $scope.data = {
        address: "gspbxqXqEUZkiCCEFFCN9Vu4FLucdjLLdLcsV6E82Qc1T7ehsTC",
        secret: "sft74k3MagHG6iF36yeSytQzCCLsJ2Fo9K4YJpQCECwgoUobc4v",
        sequence: "",
        issuer: "gnLeaAhy4i4qXAjQn7gRSNW7kJ3NF5hv5PaXb2gKnYtsvSgYgg",
        currency: "USD",
        amount: "100"
    }
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
                $scope.data.result = angular.toJson(err, true);
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
                $scope.data.result = angular.toJson(err, true);
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