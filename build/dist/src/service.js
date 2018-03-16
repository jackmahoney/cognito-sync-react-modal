"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var amazon_cognito_identity_js_1 = require("amazon-cognito-identity-js");
var log = require("debug")("csrm:service");
var AWS = require("aws-sdk");
require("amazon-cognito-js");
var StorageKey;
(function (StorageKey) {
    StorageKey["accessToken"] = "csrm:access-token";
    StorageKey["username"] = "csrm:username";
})(StorageKey || (StorageKey = {}));
var Storage = /** @class */ (function () {
    function Storage() {
    }
    Storage.getValue = function (key) {
        return window.localStorage.getItem(key);
    };
    Storage.setValue = function (key, value) {
        window.localStorage.setItem(key, value);
    };
    Storage.clearAll = function () {
        window.localStorage.clear();
    };
    return Storage;
}());
var CognitoService = /** @class */ (function () {
    function CognitoService(options) {
        this.options = options;
        this.poolData = {
            UserPoolId: this.options.awsUserPoolId,
            ClientId: this.options.awsClientId
        };
        this.userPool = new amazon_cognito_identity_js_1.CognitoUserPool(this.poolData);
    }
    CognitoService.prototype.getStoredAccessToken = function () {
        return Storage.getValue(StorageKey.accessToken);
    };
    CognitoService.prototype.getUserData = function () {
        return this.getSyncValue(this.options.datasetKey).then(function (res) { return (res ? JSON.parse(res) : res); });
    };
    CognitoService.prototype.putUserData = function (value) {
        return this.putSyncValue(this.options.datasetKey, JSON.stringify(value));
    };
    CognitoService.prototype.getSyncClient = function () {
        var _this = this;
        var loginId = Storage.getValue(StorageKey.username);
        if (!loginId) {
            throw "No loginId found";
        }
        AWS.config.region = this.options.awsRegion;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: this.options.awsIdentityPoolId,
            LoginId: loginId
        });
        return this.syncClient
            ? Promise.resolve(this.syncClient)
            : new Promise(function (res, rej) {
                AWS.config.credentials.get(function () {
                    _this.syncClient = new AWS.CognitoSyncManager();
                    res(_this.syncClient);
                });
            });
    };
    CognitoService.prototype.openOrCreate = function (name) {
        var _this = this;
        return new Promise(function (res, rej) {
            _this.getSyncClient().then(function (syncClient) {
                return syncClient.openOrCreateDataset(name, function (err, dataset) {
                    if (err) {
                        log("Error openOrCreateDataset: " + name);
                        rej(err);
                    }
                    else {
                        log("Success openOrCreateDataset: " + name);
                        res(dataset);
                    }
                });
            });
        });
    };
    CognitoService.prototype.getSyncValue = function (key) {
        return this.openOrCreate(this.options.datasetName).then(function (dataset) {
            return new Promise(function (res, rej) {
                dataset.get(key, function (err2, value) {
                    if (err2) {
                        log("Rejecting GET for " + key + " with " + err2);
                        rej(err2);
                    }
                    else {
                        log("Resolving GET for " + key + " with " + value);
                        res(value);
                    }
                });
            });
        });
    };
    CognitoService.prototype.putSyncValue = function (key, value) {
        return this.openOrCreate(this.options.datasetName).then(function (dataset) {
            return new Promise(function (res, rej) {
                dataset.put(key, value, function (err2, record) {
                    if (err2) {
                        log("Rejecting PUT for " + key + " with " + err2);
                        rej(err2);
                    }
                    else {
                        log("Resolving PUT for " + key + " and " + value + " with " + record);
                        dataset.synchronize({
                            onSuccess: function (data, newRecords) {
                                log("resolving Synchronize with " + data + " and " + newRecords);
                                res(data);
                            },
                            onFailure: function (err3) {
                                log("Rejecting Synchronize with " + err3);
                                rej(err3);
                            },
                            // just assume conflicts are fine
                            onConflict: function () { return true; }
                        });
                    }
                });
            });
        });
    };
    CognitoService.prototype.logout = function () {
        return new Promise(function (res, rej) {
            Storage.clearAll();
            res();
        });
    };
    CognitoService.prototype.login = function (username, password) {
        var _this = this;
        return new Promise(function (res, rej) {
            var authenticationData = {
                Username: username,
                Password: password
            };
            var authenticationDetails = new amazon_cognito_identity_js_1.AuthenticationDetails(authenticationData);
            var userData = {
                Username: username,
                Pool: _this.userPool
            };
            var cognitoUser = new amazon_cognito_identity_js_1.CognitoUser(userData);
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: function (result) {
                    var accessToken = result.getAccessToken().getJwtToken();
                    // store username and accessToken in localStorage
                    Storage.setValue(StorageKey.accessToken, accessToken);
                    Storage.setValue(StorageKey.username, username);
                    res(accessToken);
                },
                onFailure: function (err) {
                    rej(err);
                }
            });
        });
    };
    CognitoService.prototype.verifyUser = function (username, code) {
        var _this = this;
        return new Promise(function (res, rej) {
            var userData = {
                Username: username,
                Pool: _this.userPool
            };
            var cognitoUser = new amazon_cognito_identity_js_1.CognitoUser(userData);
            cognitoUser.confirmRegistration(code, true, function (err, result) {
                if (err) {
                    return rej(err);
                }
                res(result);
            });
        });
    };
    CognitoService.prototype.signUp = function (username, email, password) {
        var _this = this;
        return new Promise(function (res, rej) {
            var attributeList = [];
            var dataEmail = {
                Name: "email",
                Value: email
            };
            var attributeEmail = new amazon_cognito_identity_js_1.CognitoUserAttribute(dataEmail);
            attributeList.push(attributeEmail);
            _this.userPool.signUp(username, password, attributeList, [], function (err, result) {
                if (err) {
                    return rej(err);
                }
                var cognitoUser = result.user;
                res(cognitoUser.getUsername());
            });
        });
    };
    return CognitoService;
}());
exports.CognitoService = CognitoService;
//# sourceMappingURL=service.js.map