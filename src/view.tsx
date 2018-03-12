import * as React from "react";
import * as isEqual from "lodash.isequal";

import { CognitoService, CognitoServiceOptions } from "./service";

const log = require("debug")("csrm:view");

export enum AuthState {
  Anonymous,
  LoggedIn,
  HasAccount,
  Unverified,
  Unknown
}

enum Inputs {
  code = "code",
  username = "username",
  email = "email",
  password = "password"
}

interface CognitoState {
  loading: boolean;
  authState: AuthState;
  jwtToken: string;
  feedback: string;
  username: string;
  error: string;
  isInvalid: boolean;
  inputs: { any: string } | {};
}

export interface CognitoProps {
  appName: string;
  cognitoOptions: CognitoServiceOptions;
  onAuthStateChange?: (a: AuthState) => void;
  syncData: any;
  onSyncDataReceived: (a: any) => void;
  onError: (a: any) => void;
}

interface ModalProps {
  loading: boolean;
  footer: any;
  body: any;
  title: any;
  error?: string;
}

// bootstrap 4 modal helper
const Modal = (props: ModalProps) => (
  <div className="modal" role="dialog">
    <div className="modal-dialog" role="document">
      <div className="modal-content">
        <div>
          <div className="modal-header bg-light">
            <h5 className="modal-title">{props.title}</h5>
          </div>
          {props.error && (
            <div className="alert alert-danger modal-error mb-0">
              {props.error}
            </div>
          )}
          <div className="modal-body">
            <i className="fas fa-spinner d-none" />
            {props.loading ? (
              <i className="fas fa-spinner fa-pulse fa-5x text-primary text-center w100 d-block py-3 m-0" />
            ) : (
              props.body
            )}
          </div>
          <div className="modal-footer">{props.footer}</div>
        </div>
      </div>
    </div>
  </div>
);

export class CognitoView extends React.Component<CognitoProps, CognitoState> {
  private cognitoService: CognitoService;
  constructor(props: CognitoProps) {
    super(props);
    this.cognitoService = new CognitoService(props.cognitoOptions);
    this.state = {
      loading: false,
      authState: AuthState.Unknown,
      username: "",
      jwtToken: "",
      inputs: {},
      feedback: "",
      error: "",
      isInvalid: false
    };
  }
  componentDidMount() {
    // try get the token from local storage, if not prompt sign
    const storedToken = this.cognitoService.getStoredAccessToken();
    if (!storedToken) {
      const authState = AuthState.Anonymous;
      this.setState({ authState }, () => this.notifyAuthStateChange(authState));
    } else {
      const authState = AuthState.LoggedIn;
      this.setState({ jwtToken: storedToken, authState }, () =>
        this.notifyAuthStateChange(authState)
      );
    }
  }
  componentWillReceiveProps(nextProps: CognitoProps) {
    // if the sync data is different, lets update it via cognito
    if (!isEqual(this.props.syncData, nextProps.syncData)) {
      this.cognitoService
        .putUserData(nextProps)
        .catch(err => this.props.onError(err));
    }
  }
  handleInputChange(event: any) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    const inputs = Object.assign(this.state.inputs, { [name]: value });
    this.setState({ inputs });
  }
  notifyAuthStateChange(state: AuthState) {
    if (this.props.onAuthStateChange) {
      this.props.onAuthStateChange(state);
    }
  }
  notifyInvalidInputs() {
    log("Invalid inputs");
    this.setState({
      isInvalid: true,
      error: ""
    });
  }
  onSignUp() {
    const username = this.state.inputs[Inputs.username];
    const email = this.state.inputs[Inputs.email];
    const password = this.state.inputs[Inputs.password];
    if (!username || !email || !password) {
      this.notifyInvalidInputs();
    } else {
      this.performCognitoAction(
        this.cognitoService.signUp(username, email, password),
        AuthState.Unverified
      );
    }
  }
  onLogin() {
    const username = this.state.inputs[Inputs.username];
    const password = this.state.inputs[Inputs.password];
    if (!username || !password) {
      this.notifyInvalidInputs();
    } else {
      this.performCognitoAction(
        this.cognitoService.login(username, password),
        AuthState.LoggedIn
      );
    }
  }
  onVerify() {
    const username = this.state.inputs[Inputs.username];
    const code = this.state.inputs[Inputs.code];
    if (!code || !username) {
      this.notifyInvalidInputs();
    } else {
      this.performCognitoAction(
        this.cognitoService.verifyUser(username, code),
        AuthState.HasAccount
      );
    }
  }
  performCognitoAction(action: Promise<any>, nextAuthState: AuthState) {
    this.setState({ error: "", loading: true }, () => {
      action
        .then(res => {
          log(res);
          this.setState(
            {
              error: "",
              loading: false,
              authState: nextAuthState
            },
            () => this.notifyAuthStateChange(nextAuthState)
          );
        })
        .catch(err => {
          log(err);
          this.setState({ error: err.message, loading: false });
        });
    });
  }
  resendVerificationCode() {
    return null;
  }
  showLogin() {
    this.setState({ authState: AuthState.HasAccount });
  }
  showSignup() {
    this.setState({ authState: AuthState.Anonymous });
  }
  showVerify() {
    this.setState({ authState: AuthState.Unverified });
  }
  getInput(type: string, placeholder: string, name: string) {
    return (
      <div className="form-group">
        <input
          required={true}
          type={type}
          className="form-control"
          placeholder={placeholder}
          name={name}
          onChange={event => this.handleInputChange(event)}
        />
        <div className="invalid-feedback">{placeholder} is required</div>
      </div>
    );
  }
  onKeyDown = (event: any, callback: () => void): void => {
    // 'keypress' event misbehaves on mobile so we track 'Enter' key via 'keydown' event
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      callback();
    }
  };
  getForm(inputs: any[], primaryOnClick: () => void, primaryLabel: string) {
    return (
      <form
        className={this.state.isInvalid ? "was-validated" : ""}
        onKeyDown={e => this.onKeyDown(e, primaryOnClick)}
      >
        {inputs}
        <button
          type="button"
          className="btn btn-primary"
          onClick={primaryOnClick}
        >
          {primaryLabel}
        </button>
      </form>
    );
  }
  render() {
    const usernameInput = this.getInput("text", "Username", Inputs.username);
    const emailInput = this.getInput("email", "Email", Inputs.email);
    const passwordInput = this.getInput(
      "password",
      "Password",
      Inputs.password
    );
    const verifyInput = this.getInput("text", "Verification code", Inputs.code);
    // signUp
    const signUpForm = (
      <div>
        <p>
          Sign up to use <strong>{this.props.appName}</strong> — it's free and
          secure. By signing up you can save your data and share it with
          friends.
        </p>
        {this.getForm(
          [usernameInput, emailInput, passwordInput],
          () => this.onSignUp(),
          "SignUp"
        )}
      </div>
    );
    const signUpFooter = (
      <div className="text-secondary">
        Already have an account?{" "}
        <a href="#" onClick={() => this.showLogin()}>
          Login
        </a>.
      </div>
    );
    // login
    const loginForm = (
      <div>
        <p>
          Login to use <strong>{this.props.appName}</strong>.
        </p>
        {this.getForm(
          [usernameInput, passwordInput],
          () => this.onLogin(),
          "Login"
        )}
      </div>
    );
    const loginFooter = (
      <div className="text-secondary">
        Don't have an account?{" "}
        <a href="#" onClick={() => this.showSignup()}>
          Sign up
        </a>. Or{" "}
        <a href="#" onClick={() => this.showVerify()}>
          verify your account
        </a>.
      </div>
    );
    // verify
    const verfiyForm = (
      <div>
        <p>Enter your verification code.</p>
        {this.getForm(
          [usernameInput, verifyInput],
          () => this.onVerify(),
          "Verify"
        )}
      </div>
    );
    const verifyFooter = (
      <div className="text-secondary">
        Don't have an account?{" "}
        <a href="#" onClick={() => this.showSignup()}>
          Sign up
        </a>. Or{" "}
        <a href="#" onClick={() => this.resendVerificationCode()}>
          resend verification code
        </a>.
      </div>
    );
    // modal render helper
    const getModal = (title: any, body: any, footer: any) => (
      <Modal
        loading={this.state.loading}
        error={this.state.error}
        title={title}
        body={body}
        footer={footer}
      />
    );
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
  }
}
