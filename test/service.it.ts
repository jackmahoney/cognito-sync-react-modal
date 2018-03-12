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
  it("can initialize", () => {
    const service = new CognitoService(
      Object.assign(cognitoServiceOptions, functions)
    );
    return service.getUserData().should.eventually.equal("foo");
  });
});
