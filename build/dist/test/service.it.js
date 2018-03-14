"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var chai_1 = require("chai");
var config_1 = require("./config");
var service_1 = require("../src/service");
describe("cognito service", function () {
    var cookie = "";
    var functions = {
        setCookie: function (s) {
            cookie = s;
        },
        getCookie: function () { return cookie; }
    };
    it("can get empty data, save new data, get same data", function () {
        var testData = {
            a: 1,
            b: "string"
        };
        var service = new service_1.CognitoService(Object.assign(config_1.cognitoServiceOptions, functions));
        return Promise.resolve()
            .then(function () { return service.getUserData(); })
            .then(function (data) { return chai_1.expect(data).to.eql(undefined); })
            .then(function () { return service.putUserData(testData); })
            .then(function (data) {
            return chai_1.expect(data.datasetName).to.eql(config_1.cognitoServiceOptions.datasetName);
        })
            .then(function () { return service.getUserData(); })
            .then(function (data) {
            chai_1.expect(data).to.eql(testData);
        })
            .then(function () { return service.putUserData(Object.assign(testData, { b: "test" })); })
            .then(function () { return service.getUserData(); })
            .then(function (data) { return chai_1.expect(data.b).to.eql("test"); });
    });
});
//# sourceMappingURL=service.it.js.map