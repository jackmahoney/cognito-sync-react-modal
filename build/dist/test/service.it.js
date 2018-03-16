"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var chai_1 = require("chai");
var config_1 = require("./config");
var service_1 = require("../src/service");
// integration test cognito sign up using free MailSlurp API
var MailSlurpClient = require("mailslurp-client");
var mailSlurp = new MailSlurpClient.InboxcontrollerApi();
describe("cognito service", function () {
    it("can sign up, get empty data, save new data, get same data", function () {
        this.timeout(60000);
        var testData = {
            a: 1,
            b: "string"
        };
        var service = new service_1.CognitoService(config_1.cognitoServiceOptions);
        var username;
        var emailAddress;
        var password = "Test123!";
        return Promise.resolve()
            .then(function () { return service.getUserData(); })
            .catch(function (err) { return chai_1.expect(err).to.contain("No loginId found"); })
            .then(function () { return mailSlurp.createRandomInboxUsingPOST(config_1.mailSlurpApiKey); })
            .then(function (data) { return data.payload; }, function (err) {
            throw err;
        })
            .then(function (_a) {
            var id = _a.id, address = _a.address;
            username = id;
            emailAddress = address;
            chai_1.expect(username).to.eq(id);
            return service.signUp(username, emailAddress, password);
        })
            .then(function () {
            return mailSlurp
                .getEmailsForInboxUsingGET(config_1.mailSlurpApiKey, username, {
                minCount: 1,
                maxWait: 90
            })
                .then(function (data) { return data.payload; }, function (err) {
                throw err;
            })
                .then(function (_a) {
                var latestEmail = _a[0];
                // regex match for the confirmation code
                // within the email body
                var r = /\s(\d{6})\./g;
                // extract the verication code
                var verificationCode = r.exec(latestEmail.body)[1];
                return verificationCode;
            });
        })
            .then(function (verificationCode) { return service.verifyUser(username, verificationCode); })
            .then(function () { return service.login(username, password); })
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
    it("can save two different datasets with existing users", function () {
        var service = new service_1.CognitoService(config_1.cognitoServiceOptions);
        var data1 = 0;
        var data2 = 0;
        return (Promise.resolve()
            .then(function () { return service.login(config_1.users.user1.username, config_1.users.user1.password); })
            .then(function () { return service.getUserData(); })
            .then(function (data) { return (data1 = data || 0); })
            .then(function () { return service.putUserData(data1 + 1); })
            .then(function () { return service.getUserData(); })
            .then(function (data) {
            chai_1.expect(data).to.eql(data1 + 1);
            data1 = data;
        })
            .then(function () { return service.login(config_1.users.user2.username, config_1.users.user2.password); })
            .then(function () { return service.getUserData(); })
            .then(function (data) { return (data2 = data || 0); })
            .then(function () { return service.putUserData(data2 - 1); })
            .then(function () { return service.getUserData(); })
            .then(function (data) {
            chai_1.expect(data).to.eql(data2 - 1);
            data2 = data;
            chai_1.expect(data1).to.not.equal(data2);
        }));
    });
});
//# sourceMappingURL=service.it.js.map