"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Test script for rendering the view to a test html page for testing manually
 */
var React = require("react");
var ReactDOM = require("react-dom");
var config_1 = require("./config");
var view_1 = require("../src/view");
var props = {};
var App = /** @class */ (function (_super) {
    __extends(App, _super);
    function App(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            count: 0,
            authState: view_1.AuthState.Unknown
        };
        return _this;
    }
    App.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", { className: "container" },
            React.createElement(view_1.CognitoView, { onError: function (a) { }, appName: "test-appName", cognitoOptions: config_1.cognitoServiceOptions, onAuthStateChange: function (authState) {
                    _this.setState({ authState: authState });
                }, syncData: this.state.count, onSyncDataReceived: function (count) {
                    return _this.setState({ count: count || 0 });
                } }),
            React.createElement("div", { className: "row justify-content-center" },
                React.createElement("div", { className: "col-12 col-md-6 py-3" },
                    React.createElement("form", null,
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null, "Count"),
                            React.createElement("input", { type: "number", className: "form-control", value: this.state.count, onChange: function (e) {
                                    return _this.setState({ count: parseInt(e.target.value, 10) });
                                } })),
                        React.createElement("div", { className: "form-group" },
                            React.createElement("label", null, "AuthState"),
                            React.createElement("input", { type: "text", disabled: true, className: "form-control", value: this.state.authState })),
                        this.state.authState == view_1.AuthState.LoggedIn && (React.createElement("a", { className: "btn btn-primary" }, "Logout")))))));
    };
    return App;
}(React.Component));
var element = ReactDOM.render(React.createElement(App, null), document.getElementById("root"));
//# sourceMappingURL=view.js.map