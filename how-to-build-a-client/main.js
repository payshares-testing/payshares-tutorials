/**
* This demo hosted at https://github.com/stellar/stellar-tutorials/tree/master/client
*/
var myApp = angular.module('myApp', []);

// FOR TESTNET, USE BELOW. Make sure to set secure: true in the config
myApp.value("HORIZON_HOST", "horizon-testnet.stellar.org")
myApp.value("HORIZON_PORT", 443)
// myApp.value("HORIZON_HOST", "localhost")
// myApp.value("HORIZON_PORT", 8000)
// Helper service that holds the server connection
function Server(HORIZON_HOST, HORIZON_PORT) {
    return new StellarLib.Server({
        hostname:HORIZON_HOST,
        port:HORIZON_PORT,
        secure: true // true for the testnet
    });
}
myApp.service("Server", Server);

// Level 1 - Create a new Stellar Address and create an account on the testnet
function CreateStellarAddressCtrl($scope, $rootScope, Server, $location, $anchorScroll) {

    /**
    * Create a new, randomly generated keypair. The public half of the key is the stellar
    * address, and the private half is the account's secret key.
    */
    $scope.generate = function () {
        $scope.data = {};
        // PASTE CODE HERE
        var keypair = generateKeypair();
        $scope.data.keypair = keypair;
    }

    $scope.createAccount = function () {
        createAccount($scope.data.keypair.address)
            .then(function () {
                $scope.$apply(function () {
                    $scope.data.result = "Created!";
                });
            })
            .catch(function (err) {
                $scope.$apply(function () {
                    $scope.data.error = err;
                });
            });
    }

    // PASTE FUNCTION BELOW
    function generateKeypair() {
            var keypair = StellarLib.Keypair.random();
    return {
        address: keypair.address(),
        secret: keypair.seed()
    };
    }

    // PASTE FUNCTION BELOW
    function createAccount(address) {
        return Server.friendbot(address);
    }
}
myApp.controller("CreateStellarAddressCtrl", CreateStellarAddressCtrl);

// Level 2 - View Stellar Account Info
function ViewAccountBalanceCtrl($scope, Server) {
    $scope.data = {};

    /**
    * Lookup the account by address and show the data.
    */
    $scope.viewAccountInfo = function () {
        getBalances($scope.data.address)
            .then(function (balances) {
                $scope.$apply(function () {
                    $scope.data.result = angular.toJson(balances, true);
                });
            })
            .catch(StellarLib.NotFoundError, function (err) {
                $scope.$apply(function () {
                    $scope.data.result = "Account not found.";
                });
            })
            .catch(function (err) {
                $scope.$apply(function () {
                    $scope.data.error = err.stack || err;
                });
            })
    }

    // PASTE FUNCTION BELOW
    function getBalances(address) {
            return Server.accounts(address)
        .then(function (result) {
            return result.balances;
        });
    }
}
myApp.controller("ViewAccountBalanceCtrl", ViewAccountBalanceCtrl);

// Level 3 - Send a Payment
function SendPaymentCtrl($scope, Server) {
    $scope.data = {};

    $scope.sendPayment = function () {
        sendSimplePayment($scope.data.address, $scope.data.secret, $scope.data.destination,
            $scope.data.amount, $scope.data.currency, $scope.data.issuer)
        .then(function (result) {
            $scope.$apply(function () {
                $scope.data.result = angular.toJson(result, true);
            });
        })
        .catch(function (err) {
            $scope.$apply(function () {
                $scope.data.error = err.stack || err;
            });
        });
    }

    // PASTE FUNCTION BELOW
    function sendSimplePayment(address, secret, destination, amount, currency, issuer) {
            return Server.loadAccount(address)
        .then(function (account) {
            var transaction = new StellarLib.TransactionBuilder(account)
                .addOperation(StellarLib.Operation.payment({
                    destination: destination,
                    currency: new StellarLib.Currency(currency, issuer),
                    amount: amount
                }))
                .addSigner(StellarLib.Keypair.fromSeed(secret))
                .build();
            return Server.submitTransaction(transaction);
        });
    }
}
myApp.controller("SendPaymentCtrl", SendPaymentCtrl);

// Level 4 - Create a Trust Line
function CreateTrustLineCtrl($scope, Server) {
    $scope.data = {};

    $scope.createTrustLine = function () {
        createTrustLine($scope.data.address, $scope.data.secret,
            $scope.data.issuer,$scope.data.currency)
        .then(function (result) {
            $scope.$apply(function () {
                $scope.data.result = angular.toJson(result, true);
            });
        })
        .catch(function (err) {
            $scope.$apply(function () {
                $scope.data.error = err;
            });
        });
    }

    // PASTE FUNCTION BELOW
    function createTrustLine(address, secret, issuer, currency) {
    Server.loadAccount(address)
        .then(function (account) {
            var transaction = new StellarLib.TransactionBuilder(account)
                .addOperation(StellarLib.Operation.changeTrust({
                    currency: new StellarLib.Currency(currency, issuer)
                }))
                // sign the transaction with the account's secret
                .addSigner(StellarLib.Keypair.fromSeed(secret))
                .build();
            console.log(transaction);
            return Server.submitTransaction(transaction);
        });
    }
};
myApp.controller("CreateTrustLineCtrl", CreateTrustLineCtrl);

function CreateOfferCtrl($scope, Server) {
    $scope.data = {
        buy: {},
        sell: {}
    };

    $scope.createOffer = function () {
        createOffer($scope.data.address, $scope.data.secret, $scope.data.sell.code,
            $scope.data.sell.issuer, $scope.data.buy.code, $scope.data.buy.issuer,
            $scope.data.amount, $scope.data.price, $scope.data.offerId)
        .then(function (result) {
            $scope.$apply(function () {
                $scope.data.result = angular.toJson(result, true);
            });
        })
        .catch(function (err) {
            console.error(err.stack);
            $scope.$apply(function () {
                $scope.data.error = err.stack || err;
            });
        });
    }

    // PASTE FUNCTION HERE
    function createOffer(address, secret, sellCode, sellIssuer, buyCode, buyIssuer, amount, price, offerId) {
        alert("Not implemented");
    }
}
myApp.controller("CreateOfferCtrl", CreateOfferCtrl);

// View Stellar Account Info
function ViewAccountOffersCtrl($scope, Server) {
    $scope.data = {};

    /**
    * Lookup the account by address and show the data.
    */
    $scope.viewAccountOffers = function () {
        getOffers($scope.data.address)
            .then(function (offers) {
                $scope.$apply(function () {
                    $scope.data.result = angular.toJson(offers, true);
                });
            })
            .catch(StellarLib.NotFoundError, function (err) {
                $scope.$apply(function () {
                    $scope.data.result = "Account not found.";
                });
            })
            .catch(function (err) {
                $scope.$apply(function () {
                    $scope.data.error = err.stack || err;
                });
            })
    }

    // PASTE FUNCTION BELOW
    function getOffers(address) {
        alert("not implemented");
    }
}
myApp.controller("ViewAccountOffersCtrl", ViewAccountOffersCtrl);

// Send a path payment
function SendPathPaymentCtrl($scope, Server) {
    $scope.data = {};

    $scope.sendPathPayment = function () {
        sendPathPayment($scope.data.address, $scope.data.secret, $scope.data.sourcecurrency,
            $scope.data.sourceissuer, $scope.data.sendmax, $scope.data.destination,
            $scope.data.destcurrency, $scope.data.destissuer, $scope.data.amount)
        .then(function (result) {
            $scope.$apply(function () {
                $scope.data.result = angular.toJson(result, true);
            });
        })
        .catch(function (err) {
            $scope.$apply(function () {
                $scope.data.error = err.stack || err;
            });
        });
    }

    function sendPathPayment(address, secret, sourcecurrency, sourceissuer, sendmax,
            destination, destcurrency, destissuer, amount) {
        alert("not implemented");
    }
}
myApp.controller("SendPathPaymentCtrl", SendPathPaymentCtrl);
