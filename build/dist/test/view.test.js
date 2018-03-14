"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Test script for rendering the view to a test html page for testing manually
 */
var React = require("react");
var ReactDOM = require("react-dom");
var config_1 = require("./config");
var view_1 = require("../src/view");
var props = {
    appName: "test-appName",
    cognitoOptions: config_1.cognitoServiceOptions,
    onAuthStateChange: function (a) { },
    syncData: [],
    onSyncDataReceived: function (a) { },
    onError: function (a) { }
};
var element = React.createElement(view_1.CognitoView, __assign({}, props));
ReactDOM.render(element, document.getElementById("root"));
//# sourceMappingURL=view.test.js.map