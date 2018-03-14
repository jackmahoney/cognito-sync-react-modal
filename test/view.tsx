/**
 * Test script for rendering the view to a test html page for testing manually
 */
import * as React from "react";
import * as ReactDOM from "react-dom";
import { cognitoServiceOptions } from "./config";
import { CognitoView, AuthState, CognitoProps } from "../src/view";
const props = {
  appName: "test-appName",
  cognitoOptions: cognitoServiceOptions,
  onAuthStateChange: (a: AuthState) => {},
  syncData: [],
  onSyncDataReceived: (a: any) => {},
  onError: (a: any) => {}
};
const element = <CognitoView {...props} />;
ReactDOM.render(element, document.getElementById("root"));
