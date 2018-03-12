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
});
