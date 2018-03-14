import "mocha";
import { expect } from "chai";
import { cognitoServiceOptions } from "./config";
import { CognitoService, CognitoServiceOptions } from "../src/service";

describe("cognito service", () => {
  let cookie = "";
  const functions = {
    setCookie: (s: string) => {
      cookie = s;
    },
    getCookie: () => cookie
  };
  it("can get empty data, save new data, get same data", () => {
    const testData = {
      a: 1,
      b: "string"
    };
    const service = new CognitoService(
      Object.assign(cognitoServiceOptions, functions)
    );
    return Promise.resolve()
      .then(() => service.getUserData())
      .catch(err => expect(err).to.contain("No loginId found"))
      .then(() => functions.setCookie("test-cookie-value"))
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
  it("can save two different datasets", () => {
    const users = {
      user1: {
        username: "test2",
        password: "Admin123!"
      },
      user2: {
        username: "test3",
        password: "Admin123!"
      }
    };
    const service = new CognitoService(
      Object.assign(cognitoServiceOptions, functions)
    );
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
