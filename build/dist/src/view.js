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
var React = require("react");
var isEqual = require("lodash.isequal");
var service_1 = require("./service");
var styles = "\n.modal-error {\n  border-radius: 0 !important;\n  border-right: 0 !important;\n  border-left: 0 !important;\n}\n.modal {\n  display: block !important;\n  background: rgba(0, 0, 0, 0.3);\n}\nbutton {\n  cursor: pointer;\n}\n";
var log = require("debug")("csrm:view");
var AuthState;
(function (AuthState) {
    AuthState[AuthState["Anonymous"] = 0] = "Anonymous";
    AuthState[AuthState["LoggedIn"] = 1] = "LoggedIn";
    AuthState[AuthState["HasAccount"] = 2] = "HasAccount";
    AuthState[AuthState["Unverified"] = 3] = "Unverified";
    AuthState[AuthState["Unknown"] = 4] = "Unknown";
})(AuthState = exports.AuthState || (exports.AuthState = {}));
var Inputs;
(function (Inputs) {
    Inputs["code"] = "code";
    Inputs["username"] = "username";
    Inputs["email"] = "email";
    Inputs["password"] = "password";
})(Inputs || (Inputs = {}));
// bootstrap 4 modal helper
var Modal = function (props) { return (React.createElement("div", { className: "modal", role: "dialog" },
    React.createElement("style", { dangerouslySetInnerHTML: {
            __html: styles
        } }),
    React.createElement("div", { className: "modal-dialog", role: "document" },
        React.createElement("div", { className: "modal-content" },
            React.createElement("div", null,
                React.createElement("div", { className: "modal-header bg-light" },
                    React.createElement("h5", { className: "modal-title" }, props.title)),
                props.error && (React.createElement("div", { className: "alert alert-danger modal-error mb-0" }, props.error)),
                React.createElement("div", { className: "modal-body" },
                    React.createElement("i", { className: "fas fa-spinner d-none" }),
                    props.loading ? (React.createElement("i", { className: "fas fa-spinner fa-pulse fa-5x text-primary text-center w100 d-block py-3 m-0" })) : (props.body)),
                React.createElement("div", { className: "modal-footer" }, props.footer)))))); };
var CognitoView = /** @class */ (function (_super) {
    __extends(CognitoView, _super);
    function CognitoView(props) {
        var _this = _super.call(this, props) || this;
        _this.showLogin = function () { return _this.setState({ authState: AuthState.HasAccount }); };
        _this.showSignup = function () { return _this.setState({ authState: AuthState.Anonymous }); };
        _this.showVerify = function () { return _this.setState({ authState: AuthState.Unverified }); };
        _this.onKeyDown = function (event, callback) {
            // 'keypress' event misbehaves on mobile so we track 'Enter' key via 'keydown' event
            if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                callback();
            }
        };
        _this.cognitoService = new service_1.CognitoService(props.cognitoOptions);
        _this.state = {
            loading: false,
            authState: AuthState.Unknown,
            username: "",
            jwtToken: "",
            inputs: {},
            feedback: "",
            error: "",
            isInvalid: false
        };
        return _this;
    }
    CognitoView.prototype.componentDidMount = function () {
        var _this = this;
        // try get the token from local storage, if not prompt sign
        var storedToken = this.cognitoService.getStoredAccessToken();
        if (!storedToken) {
            var authState_1 = AuthState.Anonymous;
            log("No stored token, state is " + authState_1);
            this.setState({ authState: authState_1 }, function () { return _this.notifyAuthStateChange(authState_1); });
        }
        else {
            var authState_2 = AuthState.LoggedIn;
            log("Stored token, state is " + authState_2);
            this.setState({ jwtToken: storedToken, authState: authState_2 }, function () {
                return _this.notifyAuthStateChange(authState_2);
            });
        }
    };
    CognitoView.prototype.componentWillReceiveProps = function (nextProps) {
        var _this = this;
        // if the sync data is different, lets update it via cognito
        if (!isEqual(this.props.syncData, nextProps.syncData)) {
            log("Component received unequal syncData, putting to store");
            this.cognitoService
                .putUserData(nextProps.syncData)
                .catch(function (err) { return _this.props.onError(err); });
        }
        else {
            log("Component received equal syncData, ignoing");
        }
    };
    CognitoView.prototype.handleInputChange = function (event) {
        var target = event.target;
        var value = target.type === "checkbox" ? target.checked : target.value;
        var name = target.name;
        var inputs = Object.assign(this.state.inputs, (_a = {}, _a[name] = value, _a));
        this.setState({ inputs: inputs });
        var _a;
    };
    CognitoView.prototype.notifyAuthStateChange = function (state) {
        var _this = this;
        if (this.props.onAuthStateChange) {
            this.props.onAuthStateChange(state);
        }
        if (this.state.authState === AuthState.LoggedIn) {
            log("State is LoggedIn, fetching user data");
            this.cognitoService
                .getUserData()
                .then(function (data) {
                if (!isEqual(data, _this.props.syncData)) {
                    log("Data received on authChange is new, notifying parent");
                    _this.props.onSyncDataReceived(data);
                }
                else {
                    log("Data received on authChange is not new");
                }
            })
                .catch(function (err) { return _this.props.onError(err); });
        }
    };
    CognitoView.prototype.notifyInvalidInputs = function () {
        log("Invalid inputs");
        this.setState({
            isInvalid: true,
            error: ""
        });
    };
    CognitoView.prototype.onSignUp = function () {
        var username = this.state.inputs[Inputs.username];
        var email = this.state.inputs[Inputs.email];
        var password = this.state.inputs[Inputs.password];
        if (!username || !email || !password) {
            this.notifyInvalidInputs();
        }
        else {
            this.performCognitoAction(this.cognitoService.signUp(username, email, password), AuthState.Unverified);
        }
    };
    CognitoView.prototype.onLogin = function () {
        var username = this.state.inputs[Inputs.username];
        var password = this.state.inputs[Inputs.password];
        if (!username || !password) {
            this.notifyInvalidInputs();
        }
        else {
            this.performCognitoAction(this.cognitoService.login(username, password), AuthState.LoggedIn);
        }
    };
    CognitoView.prototype.onVerify = function () {
        var username = this.state.inputs[Inputs.username];
        var code = this.state.inputs[Inputs.code];
        if (!code || !username) {
            this.notifyInvalidInputs();
        }
        else {
            this.performCognitoAction(this.cognitoService.verifyUser(username, code), AuthState.HasAccount);
        }
    };
    CognitoView.prototype.performCognitoAction = function (action, nextAuthState) {
        var _this = this;
        this.setState({ error: "", loading: true }, function () {
            action
                .then(function (res) {
                log(res);
                _this.setState({
                    error: "",
                    loading: false,
                    authState: nextAuthState
                }, function () { return _this.notifyAuthStateChange(nextAuthState); });
            })
                .catch(function (err) {
                log(err);
                _this.setState({ error: err.message, loading: false });
            });
        });
    };
    CognitoView.prototype.resendVerificationCode = function () {
        return null;
    };
    CognitoView.prototype.getInput = function (type, placeholder, name) {
        var _this = this;
        return (React.createElement("div", { className: "form-group" },
            React.createElement("input", { required: true, type: type, className: "form-control", placeholder: placeholder, name: name, onChange: function (event) { return _this.handleInputChange(event); } }),
            React.createElement("div", { className: "invalid-feedback" },
                placeholder,
                " is required")));
    };
    CognitoView.prototype.getForm = function (inputs, primaryOnClick, primaryLabel) {
        var _this = this;
        return (React.createElement("form", { className: this.state.isInvalid ? "was-validated" : "", onKeyDown: function (e) { return _this.onKeyDown(e, primaryOnClick); } },
            inputs,
            React.createElement("button", { type: "button", className: "btn btn-primary", onClick: primaryOnClick }, primaryLabel)));
    };
    CognitoView.prototype.render = function () {
        var _this = this;
        var usernameInput = this.getInput("text", "Username", Inputs.username);
        var emailInput = this.getInput("email", "Email", Inputs.email);
        var passwordInput = this.getInput("password", "Password", Inputs.password);
        var verifyInput = this.getInput("text", "Verification code", Inputs.code);
        // signUp
        var signUpForm = (React.createElement("div", null,
            React.createElement("p", null,
                "Sign up to use ",
                React.createElement("strong", null, this.props.appName),
                " \u2014 it's free and secure. By signing up you can save your data and share it with friends."),
            this.getForm([usernameInput, emailInput, passwordInput], function () { return _this.onSignUp(); }, "SignUp")));
        var signUpFooter = (React.createElement("div", { className: "text-secondary" },
            "Already have an account?",
            " ",
            React.createElement("a", { href: "#", onClick: function () { return _this.showLogin(); } }, "Login"),
            "."));
        // login
        var loginForm = (React.createElement("div", null,
            React.createElement("p", null,
                "Login to use ",
                React.createElement("strong", null, this.props.appName),
                "."),
            this.getForm([usernameInput, passwordInput], function () { return _this.onLogin(); }, "Login")));
        var loginFooter = (React.createElement("div", { className: "text-secondary" },
            "Don't have an account?",
            " ",
            React.createElement("a", { href: "#", onClick: function () { return _this.showSignup(); } }, "Sign up"),
            ". Or",
            " ",
            React.createElement("a", { href: "#", onClick: function () { return _this.showVerify(); } }, "verify your account"),
            "."));
        // verify
        var verfiyForm = (React.createElement("div", null,
            React.createElement("p", null, "Enter your verification code."),
            this.getForm([usernameInput, verifyInput], function () { return _this.onVerify(); }, "Verify")));
        var verifyFooter = (React.createElement("div", { className: "text-secondary" },
            "Don't have an account?",
            " ",
            React.createElement("a", { href: "#", onClick: function () { return _this.showSignup(); } }, "Sign up"),
            ". Or",
            " ",
            React.createElement("a", { href: "#", onClick: function () { return _this.resendVerificationCode(); } }, "resend verification code"),
            "."));
        // modal render helper
        var getModal = function (title, body, footer) { return (React.createElement(Modal, { loading: _this.state.loading, error: _this.state.error, title: title, body: body, footer: footer })); };
        // render logic
        switch (this.state.authState) {
            case AuthState.Anonymous:
                return getModal("Sign up", signUpForm, signUpFooter);
            case AuthState.HasAccount:
                return getModal("Login", loginForm, loginFooter);
            case AuthState.Unverified:
                return getModal("Verify", verfiyForm, verifyFooter);
            default:
            case AuthState.Unknown:
            case AuthState.LoggedIn:
                return null;
        }
    };
    return CognitoView;
}(React.Component));
exports.CognitoView = CognitoView;
//# sourceMappingURL=view.js.map