export interface CognitoServiceOptions {
    awsIdentityPoolId: string;
    awsRegion: string;
    awsUserPoolId: string;
    awsClientId: string;
    datasetName: string;
    datasetKey: string;
    cookieName: string;
    getCookie?: () => string;
    clearCookie?: () => void;
    setCookie?: (s: string) => void;
}
export declare class CognitoService {
    private poolData;
    private userPool;
    private syncClient;
    private options;
    constructor(options: CognitoServiceOptions);
    getUserData(): Promise<any>;
    putUserData(value: any): Promise<any>;
    private getSyncClient();
    private openOrCreate(name);
    getSyncValue(key: string): Promise<any>;
    putSyncValue(key: string, value: any): Promise<any>;
    logout(): Promise<any>;
    getStoredAccessToken(): string;
    login(username: string, password: string): Promise<string>;
    verifyUser(username: string, code: string): Promise<{}>;
    signUp(username: string, email: string, password: string): Promise<string>;
}
