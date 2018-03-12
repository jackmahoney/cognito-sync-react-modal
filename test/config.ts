import { CognitoServiceOptions } from "../src/service";

export const cognitoServiceOptions: CognitoServiceOptions = {
  awsUserPoolId: "us-west-2_eWduZrFKg",
  awsClientId: "703plmqufo12rtmf7d5gnntm1k",
  awsIdentityPoolId: "us-west-2:d1d4fdfe-20cb-42e1-b08d-310748ba0b8b",
  awsRegion: "us-west-2",
  datasetName: "test_datasetName",
  datasetKey: "test_datasetKey",
  cookieName: "test_cookieName",
  getCookie: () => "",
  clearCookie: () => {},
  setCookie: (s: string) => {}
};
