/// <reference types="react" />
import * as React from "react";
import { CognitoServiceOptions } from "./service";
export declare enum AuthState {
    Anonymous = 0,
    LoggedIn = 1,
    HasAccount = 2,
    Unverified = 3,
    Unknown = 4,
}
export interface CognitoState {
    loading: boolean;
    authState: AuthState;
    jwtToken: string;
    feedback: string;
    username: string;
    error: string;
    isInvalid: boolean;
    inputs: {
        any: string;
    } | {};
}
export interface CognitoProps {
    appName: string;
    cognitoOptions: CognitoServiceOptions;
    onAuthStateChange?: (a: AuthState) => void;
    syncData: any;
    onSyncDataReceived: (a: any) => void;
    onError: (a: any) => void;
}
export declare class CognitoView extends React.Component<CognitoProps, CognitoState> {
    private cognitoService;
    constructor(props: CognitoProps);
    componentDidMount(): void;
    componentWillReceiveProps(nextProps: CognitoProps): void;
    handleInputChange(event: any): void;
    notifyAuthStateChange(state: AuthState): void;
    notifyInvalidInputs(): void;
    onSignUp(): void;
    onLogin(): void;
    onVerify(): void;
    performCognitoAction(action: Promise<any>, nextAuthState: AuthState): void;
    resendVerificationCode(): any;
    showLogin(): void;
    showSignup(): void;
    showVerify(): void;
    getInput(type: string, placeholder: string, name: string): JSX.Element;
    onKeyDown: (event: any, callback: () => void) => void;
    getForm(inputs: any[], primaryOnClick: () => void, primaryLabel: string): JSX.Element;
    render(): JSX.Element;
}
