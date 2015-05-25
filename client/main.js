/**
* This demo hosted at https://github.com/stellar/stellar-tutorials/tree/master/client
*/
var myApp = angular.module('myApp', []);

// Level 1 - Create a new Stellar Address and create an account on the testnet
function CreateStellarAddressCtrl($scope, $rootScope, Server, $location, $anchorScroll) {

    /**
    * Create a new, randomly generated keypair. The public half of the key is the stellar
    * address, and the private half is the account's secret key.
    */
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
                    $scope.data.result = "Created!";
                });
            })
            .catch(function (err) {
                $scope.$apply(function () {
                    $scope.data.error = err;
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

/**
* Helps manage created accounts. Easily see account balances, name accounts, and quickly
* pre fill in address and secret for actions on the account.
*/
function AccountManagerCtrl($scope, $rootScope, $location, $anchorScroll, Server) {
    /**
    * Add the root account as the default stored account.
    */
    $scope.accounts = [];
    // store previously stored accounts
    restoreAccounts();
    $scope.accounts.unshift({
        name: "root",
        keypair: {
            address: "gspbxqXqEUZkiCCEFFCN9Vu4FLucdjLLdLcsV6E82Qc1T7ehsTC",
            secret: "sft74k3MagHG6iF36yeSytQzCCLsJ2Fo9K4YJpQCECwgoUobc4v"
        }
    });

    $scope.storeAccount = function (name, account) {
        storeAccount($scope.data.name, $scope.data.address, $scope.data.secret);
        $scope.data = {};
    }

    $scope.removeAccount = function (index) {
        $scope.accounts.splice(index,1);
        saveAccounts();
    }

    function saveAccounts() {
        var accounts;
        // dont save the root account
        if ($scope.accounts[0] && $scope.accounts[0].keypair.secret == "sft74k3MagHG6iF36yeSytQzCCLsJ2Fo9K4YJpQCECwgoUobc4v") {
            accounts = $scope.accounts.slice(1);
        } else {
            accounts = $scope.accounts;
        }
        localStorage.accountStorage = angular.toJson({
            accounts: accounts
        });
    }

    function restoreAccounts() {
        var accountStorage = angular.fromJson(localStorage.accountStorage);
        if (accountStorage) {
            $scope.accounts = accountStorage.accounts;
        }
    }

    /**
    * Got a request to store the account.
    */
    $scope.$on("storeaccount", function (event, name, address, secret) {
        storeAccount(name, address, secret);
    });

    function storeAccount(name, address, secret) {
        $scope.accounts.push({
            name: name,
            keypair: {
                address: address,
                secret: secret
            },
            collapsed: true
        });
        saveAccounts();
    }

    /**
    * Lookup the account by address and show the account's balances.
    */
    $scope.refreshBalances = function (account) {
        Server.accounts(account.keypair.address)
            .then(function (result) {
                $scope.$apply(function () {
                    account.balances = result.balances;
                });
            });
    }

    /**
    * Lookup the account by address and show the account's offers.
    */
    $scope.refreshOffers = function (account) {
        Server.accounts(account.keypair.address, "offers")
            .then(function (result) {
                $scope.$apply(function () {
                    account.offers = result.records;
                });
            })
    }

    /**
    * Fill in the given account's address and secret in the view account widget.
    */
    $scope.viewAccount = function (account) {
        $rootScope.$broadcast("viewaccount", account.keypair);
        $location.hash('viewaccount');
        $anchorScroll();
    }

    /**
    * Fill in the given account's address and secret in the view account widget.
    */
    $scope.setOptions = function (account) {
        $rootScope.$broadcast("setoptions", account.keypair);
        $location.hash('setoptions');
        $anchorScroll();
    }

    /**
    * Fill in the given account's address and secret in the payment widget.
    */
    $scope.sendSimplePayment = function (account) {
        $rootScope.$broadcast("sendpayment", account.keypair);
        $location.hash('payment');
        $anchorScroll();
    }

    /**
    * Fill in the given account's address and secret in the payment widget.
    */
    $scope.sendPathPayment = function (account) {
        $rootScope.$broadcast("sendpathpayment", account.keypair);
        $location.hash('pathpayment');
        $anchorScroll();
    }

    /**
    * Fill in the given account's address and secret in the add trust widget.
    */
    $scope.addTrust = function (account) {
        $rootScope.$broadcast("addtrust", account.keypair);
        $location.hash('addtrust');
        $anchorScroll();
    }

    $scope.authorizeTrust = function (account) {
        $rootScope.$broadcast("authorizetrust", account.keypair);
        $location.hash('authorizetrust');
        $anchorScroll();
    }

    /**
    * Fill in the given account's address and secret in the create offer widget.
    */
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

    /**
    * Received a broadcast to automatically fill in the keypair into the form.
    */
    $scope.$on("viewaccount", function (event, keypair) {
        $scope.data.address = keypair.address;
    });

    /**
    * Lookup the account by address and show the data.
    */
    $scope.viewAccountInfo = function () {
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
                    $scope.data.error = err.stack || err;
                });
            })
    }
}
myApp.controller("ViewAccountInfoCtrl", ViewAccountInfoCtrl);

function ViewOffersCtrl($scope, Server) {
    /**
    * Received a broadcast to automatically fill in the keypair into the form.
    */
    $scope.$on("viewoffers", function (event, keypair) {
        $scope.data.address = keypair.address;
        $scope.data.secret = keypair.secret;
    });

    $scope.data = {};

    /**
    * Lookup the offers by address and show the data.
    */
    $scope.viewOffers = function () {
        Server.accounts($scope.data.address, "offers")
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
}
myApp.controller("ViewOffersCtrl", ViewOffersCtrl);

function SetOptionsCtrl($scope, Server) {
    /**
    * Received a broadcast to automatically fill in the keypair into the form.
    */
    $scope.$on("setoptions", function (event, keypair) {
        $scope.data.address = keypair.address;
        $scope.data.secret = keypair.secret;
    });

    $scope.data = {
        // setting flags is an int, a bitwise & of all the flags for the account
        setFlags: {
            AUTH_REQUIRED_FLAG: 0,
            AUTH_REVOCABLE_FLAG: 0
        },
        getSetFlags: function () {
            return this.setFlags.AUTH_REQUIRED_FLAG | this.setFlags.AUTH_REVOCABLE_FLAG;
        },
        // claer flags is an int, a bitwise & of all the flags for the account
        clearFlags: {
            AUTH_REQUIRED_FLAG: 0,
            AUTH_REVOCABLE_FLAG: 0
        },
        getClearFlags: function () {
            return this.clearFlags.AUTH_REQUIRED_FLAG | this.clearFlags.AUTH_REVOCABLE_FLAG;
        },
        thresholds: {},
        signer: {}
    };

    $scope.setOptions = function () {
        Server.accounts($scope.data.address)
            .then(function (account) {
                // we'll only set the options the user has given
                var options = {};
                if ($scope.data.getSetFlags()) {
                    options.setFlags = $scope.data.getSetFlags();
                }
                if ($scope.data.getClearFlags()) {
                    options.clearFlags = $scope.data.getClearFlags();
                }
                if (Object.getOwnPropertyNames($scope.data.thresholds).length) {
                    options.thresholds = $scope.data.thresholds;
                }
                if (Object.getOwnPropertyNames($scope.data.signer).length) {
                    options.signer = $scope.data.signer;
                }
                if ($scope.data.homeDomain) {
                    options.homeDomain = $scope.data.homeDomain;
                }
                var transaction = new StellarLib.TransactionBuilder(account)
                    .addOperation(StellarLib.Operation.setOptions(options))
                    // sign the transaction with the account's secret key
                    .addSigner(StellarLib.Keypair.fromSeed($scope.data.secret))
                    .build();
                console.log(transaction);
                return Server.submitTransaction(transaction);
            })
            .then(function (result) {
                $scope.$apply(function () {
                    $scope.data.result = angular.toJson(result, true);
                });
            })
            .catch(function (err) {
                console.log(err);
                $scope.$apply(function () {
                    $scope.data.error = err.stack || err;
                });
            });
    }
}
myApp.controller("SetOptionsCtrl", SetOptionsCtrl);

// Level 3 - Send a Payment
function SendPaymentCtrl($scope, Server) {
    $scope.data = {};

    /**
    * Received a broadcast to automatically fill in the keypair into the form.
    */
    $scope.$on("sendpayment", function (event, keypair) {
        $scope.data.address = keypair.address;
        $scope.data.secret = keypair.secret;
    });

    $scope.sendPayment = function () {
        sendPayment($scope.data);
    }

    function sendPayment(data) {
        // first load the account from the server (stellarlib uses the account's latest sequence #)
        Server.loadAccount(data.address)
        .then(function (account) {
            // create a new transaction using StellarLib's TransactionBuilder
            var transaction = new StellarLib.TransactionBuilder(account, {
                    // add a memo to the transaction if they gave one
                    memo: data.memo ? StellarLib.Memo.text(data.memo) : ""
                })
                // add a "payment" operation to the transaction
                .addOperation(StellarLib.Operation.payment({
                    destination: $scope.data.destination,
                    currency: new StellarLib.Currency(data.currency, data.issuer),
                    amount: $scope.data.amount
                }))
                // sign the transaction with the account's secret key
                .addSigner(StellarLib.Keypair.fromSeed(data.secret))
                .build();
            return Server.submitTransaction(transaction);
        })
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
}
myApp.controller("SendPaymentCtrl", SendPaymentCtrl);

// Level 3.5 Send a path payment
function SendPathPaymentCtrl($scope, Server) {
    $scope.data = {};

    /**
    * Received a broadcast to automatically fill in the keypair into the form.
    */
    $scope.$on("sendpathpayment", function (event, keypair) {
        $scope.data.address = keypair.address;
        $scope.data.secret = keypair.secret;
    });

    $scope.sendPathPayment = function () {
        sendPathPayment($scope.data);
    }

    function sendPathPayment(data) {
        // first load the account from the server (stellarlib uses the account's latest sequence #)
        Server.loadAccount(data.address)
        .then(function (account) {
            // create a new transaction using StellarLib's TransactionBuilder
            var transaction = new StellarLib.TransactionBuilder(account, {
                    // add a memo to the transaction if they gave one
                    memo: data.memo ? StellarLib.Memo.text(data.memo) : ""
                })
                // add a "payment" operation to the transaction
                .addOperation(StellarLib.Operation.pathPayment({
                    sendCurrency: new StellarLib.Currency(data.sourcecurrency, data.sourceissuer),
                    sendMax: data.sendmax,
                    destination: data.destination,
                    destCurrency: new StellarLib.Currency(data.destcurrency, data.destissuer),
                    destAmount: data.amount
                }))
                // sign the transaction with the account's secret key
                .addSigner(StellarLib.Keypair.fromSeed(data.secret))
                .build();
            return Server.submitTransaction(transaction);
        })
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
}
myApp.controller("SendPathPaymentCtrl", SendPathPaymentCtrl);

function StreamAccountTransactionsCtrl($scope, Server) {
    $scope.data = {};
    var es = null;

    $scope.streamTransactions = function () {
        if (es != null) {
            es.close();
        }
        $scope.data.error = null;
        $scope.data.transactions = [];
        // call the "accounts" endpoint and pass it streaming event handlers
        // this will return the "EventSource" object that we can close after we're through
        es = Server.accounts($scope.data.address, "transactions", {
            streaming: {
                onmessage: onTransaction,
                onerror: onError
            }
        });
    }

    var onTransaction = function (transaction) {
        $scope.$apply(function () {
            $scope.data.transactions.push(transaction, true);
        });
    }

    var onError = function (err) {
        if (es != null) {
            es.close();
            es = null;
        }
        $scope.$apply(function () {
            $scope.data.error = err.stack || err;
        });
    }
}
myApp.controller("StreamAccountTransactionsCtrl", StreamAccountTransactionsCtrl);


// Level 4 - Create a Trust Line
function CreateTrustLineCtrl($scope, Server) {
    $scope.data = {};

    /**
    * Received a broadcast to automatically fill in the keypair into the form.
    */
    $scope.$on("addtrust", function (event, keypair) {
        $scope.data.address = keypair.address;
        $scope.data.secret = keypair.secret;
    });

    $scope.createTrustLine = function () {
        // first load the account from the server
        Server.loadAccount($scope.data.address)
        .then(function (account) {
            // transactionbuilder uses the account's latest sequence #
            return new StellarLib.TransactionBuilder(account)
                // add a "changeTrust" operation to the transaction
                .addOperation(StellarLib.Operation.changeTrust({
                    currency: new StellarLib.Currency($scope.data.currency, $scope.data.issuer)
                }))
                // sign the transaction with the account's secret
                .addSigner(StellarLib.Keypair.fromSeed($scope.data.secret))
                .build();
        })
        .then(function (transaction) {
            return Server.submitTransaction(transaction);
        })
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
};
myApp.controller("CreateTrustLineCtrl", CreateTrustLineCtrl);

// Level 5 - Authorize Trust Line
function AuthorizeTrustCtrl($scope, Server) {
    $scope.data = {};

    /**
    * Received a broadcast to automatically fill in the keypair into the form.
    */
    $scope.$on("authorizetrust", function (event, keypair) {
        $scope.data.address = keypair.address;
        $scope.data.secret = keypair.secret;
    });

    $scope.authorizeTrust = function () {
        // first load the account from the server
        Server.loadAccount($scope.data.address)
        .then(function (account) {
            console.log($scope.data.authorize);
            // transactionbuilder uses the account's latest sequence #
            var transaction = new StellarLib.TransactionBuilder(account)
                // add a "changeTrust" operation to the transaction
                .addOperation(StellarLib.Operation.allowTrust({
                    trustor: $scope.data.trustor,
                    currencyCode: $scope.data.currency,
                    authorize: $scope.data.authorize
                }))
                // sign the transaction with the account's secret
                .addSigner(StellarLib.Keypair.fromSeed($scope.data.secret))
                .build();
            console.log(transaction);
            return transaction;
        })
        .then(function (transaction) {
            return Server.submitTransaction(transaction);
        })
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
};
myApp.controller("AuthorizeTrustCtrl", AuthorizeTrustCtrl);

function CreateOfferCtrl($scope, Server) {
    $scope.data = {
        buy: {},
        sell: {}
    };

    /**
    * Received a broadcast to automatically fill in the keypair into the form.
    */
    $scope.$on("createoffer", function (event, keypair) {
        $scope.data.address = keypair.address;
        $scope.data.secret = keypair.secret;
    });

    $scope.createOffer = function () {
        // load the latest sequence number for the account
        Server.loadAccount($scope.data.address)
        .then(function (account) {
            var transaction = new StellarLib.TransactionBuilder(account)
                // add a "createOffer" operation to the transaction
                .addOperation(StellarLib.Operation.createOffer({
                    // the currency we're selling
                    takerGets: new StellarLib.Currency($scope.data.sell.code, $scope.data.sell.issuer),
                    // the currency we're buying
                    takerPays: new StellarLib.Currency($scope.data.buy.code, $scope.data.buy.issuer),
                    // the amount we're selling
                    amount: $scope.data.amount,
                    // the exchange rate we're charging
                    price: $scope.data.price,
                    // an offer ID, 0 for delete the offer
                    offerId: $scope.data.offerId
                }))
                // sign the transaction with the account's secret key
                .addSigner(StellarLib.Keypair.fromSeed($scope.data.secret))
                .build();
            return Server.submitTransaction(transaction);
        })
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
}
myApp.controller("CreateOfferCtrl", CreateOfferCtrl);

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