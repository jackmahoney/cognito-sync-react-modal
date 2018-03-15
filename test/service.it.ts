import "mocha";
import { expect } from "chai";
import { cognitoServiceOptions, users, mailSlurpApiKey } from "./config";
import { CognitoService, CognitoServiceOptions } from "../src/service";

// integration test cognito sign up using free MailSlurp API
const MailSlurpClient = require("mailslurp-client");
const mailSlurp = new MailSlurpClient.InboxcontrollerApi();

describe("cognito service", () => {
  it("can sign up, get empty data, save new data, get same data", function() {
    this.timeout(60000);
    const testData = {
      a: 1,
      b: "string"
    };
    const service = new CognitoService(cognitoServiceOptions);
    let username;
    let emailAddress;
    const password = "Test123!";
    return Promise.resolve()
      .then(() => service.getUserData())
      .catch(err => expect(err).to.contain("No loginId found"))
      .then(() => mailSlurp.createRandomInboxUsingPOST(mailSlurpApiKey))
      .then(
        data => data.payload,
        err => {
          throw err;
        }
      )
      .then(({ id, address }) => {
        username = id;
        emailAddress = address;
        expect(username).to.eq(id);
        return service.signUp(username, emailAddress, password);
      })
      .then(() => {
        return mailSlurp
          .getEmailsForInboxUsingGET(mailSlurpApiKey, username, {
            minCount: 1,
            maxWait: 90
          })
          .then(
            data => data.payload,
            err => {
              throw err;
            }
          )
          .then(([latestEmail]) => {
            // regex match for the confirmation code
            // within the email body
            const r = /\s(\d{6})\./g;
            // extract the verication code
            const verificationCode = r.exec(latestEmail.body)[1];
            return verificationCode;
          });
      })
      .then(verificationCode => service.verifyUser(username, verificationCode))
      .then(() => service.login(username, password))
      .then(() => service.getUserData())
      .then(data => expect(data).to.eql(undefined))
      .then(() => service.putUserData(testData))
      .then(data =>
        expect(data.datasetName).to.eql(cognitoServiceOptions.datasetName)
      )
      .then(() => service.getUserData())
      .then(data => {
        expect(data).to.eql(testData);
      })
      .then(() => service.putUserData(Object.assign(testData, { b: "test" })))
      .then(() => service.getUserData())
      .then(data => expect(data.b).to.eql("test"));
  });
  it("can save two different datasets with existing users", () => {
    const service = new CognitoService(cognitoServiceOptions);
    let data1 = 0;
    let data2 = 0;
    return (
      Promise.resolve()
        // first save some data as user 1
        .then(() => service.login(users.user1.username, users.user1.password))
        .then(() => service.getUserData())
        .then(data => (data1 = data || 0))
        .then(() => service.putUserData(data1 + 1))
        .then(() => service.getUserData())
        .then(data => {
          expect(data).to.eql(data1 + 1);
          data1 = data;
        })
        // then do the same as user 2
        .then(() => service.login(users.user2.username, users.user2.password))
        .then(() => service.getUserData())
        .then(data => (data2 = data || 0))
        .then(() => service.putUserData(data2 - 1))
        .then(() => service.getUserData())
        // check that two data sets can be saved
        .then(data => {
          expect(data).to.eql(data2 - 1);
          data2 = data;
          expect(data1).to.not.equal(data2);
        })
    );
  });
});
