import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails
} from "amazon-cognito-identity-js";

const log = require("debug")("csrm:service");
const AWS = require("aws-sdk");
require("amazon-cognito-js");

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

export class CognitoService {
  private poolData: { UserPoolId: string; ClientId: string };
  private userPool: CognitoUserPool;
  private syncClient: any;
  private options: CognitoServiceOptions;

  constructor(options: CognitoServiceOptions) {
    const defaultOptions = {
      getCookie() {
        window.localStorage.getItem(options.cookieName);
      },
      setCookie(value: string) {
        window.localStorage.setItem(options.cookieName, value);
      },
      clearCookie() {
        window.localStorage.removeItem(options.cookieName);
      }
    };

    this.options = Object.assign(defaultOptions, options);

    this.poolData = {
      UserPoolId: options.awsUserPoolId,
      ClientId: options.awsClientId
    };

    AWS.config.region = options.awsRegion;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: options.awsIdentityPoolId
    });

    this.userPool = new CognitoUserPool(this.poolData);
  }

  getUserData(): Promise<any> {
    return this.getSyncValue(this.options.datasetKey);
  }

  putUserData(value: any) {
    return this.putSyncValue(this.options.datasetKey, value);
  }

  private getSyncClient() {
    return this.syncClient
      ? Promise.resolve(this.syncClient)
      : new Promise((res, rej) => {
          AWS.config.credentials.get(() => {
            this.syncClient = new AWS.CognitoSyncManager();
            res(this.syncClient);
          });
        });
  }

  private openOrCreate(name: string): Promise<any> {
    return new Promise((res, rej) => {
      this.getSyncClient().then(syncClient =>
        syncClient.openOrCreateDataset(name, (err, dataset) => {
          if (err) {
            log(`Error openOrCreateDataset: ${name}`);
            rej(err);
          } else {
            log(`Success openOrCreateDataset: ${name}`);
            res(dataset);
          }
        })
      );
    });
  }

  getSyncValue(key: string): Promise<any> {
    return this.openOrCreate(this.options.datasetName).then(dataset => {
      return new Promise((res, rej) => {
        dataset.get(key, (err2, value) => {
          if (err2) {
            log(`Rejecting GET for ${key} with ${err2}`);
            rej(err2);
          } else {
            log(`Resolving GET for ${key} with ${value}`);
            res(value);
          }
        });
      });
    });
  }

  putSyncValue(key: string, value: any): Promise<any> {
    return this.openOrCreate(this.options.datasetName).then(dataset => {
      return new Promise((res, rej) => {
        dataset.put(key, value, (err2, record) => {
          if (err2) {
            log(`Rejecting PUT for ${key} with ${err2}`);
            rej(err2);
          } else {
            log(`Resolving PUT for ${key} and ${value} with ${record}`);
            dataset.synchronize({
              onSuccess: (data, newRecords) => {
                log(`resolving Synchronize with ${data} and ${newRecords}`);
                res(data);
              },
              onFailure: err3 => {
                log(`Rejecting Synchronize with ${err3}`);
                rej(err3);
              },
              // just assume conflicts are fine
              onConflict: () => true
            });
          }
        });
      });
    });
  }

  logout(): Promise<any> {
    return new Promise((res, rej) => {
      this.options.clearCookie();
      res();
    });
  }

  getStoredAccessToken() {
    return this.options.getCookie();
  }

  login(username: string, password: string): Promise<string> {
    return new Promise((res, rej) => {
      const authenticationData = {
        Username: username,
        Password: password
      };
      const authenticationDetails = new AuthenticationDetails(
        authenticationData
      );
      const userData = {
        Username: username,
        Pool: this.userPool
      };
      const cognitoUser = new CognitoUser(userData);
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result: any) => {
          const accessToken = result.getAccessToken().getJwtToken();
          this.options.setCookie(accessToken);
          res(accessToken);
        },

        onFailure(err: any) {
          rej(err);
        }
      });
    });
  }

  verifyUser(username: string, code: string) {
    return new Promise((res, rej) => {
      const userData = {
        Username: username,
        Pool: this.userPool
      };

      const cognitoUser = new CognitoUser(userData);
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          return rej(err);
        }
        res(result);
      });
    });
  }

  signUp(username: string, email: string, password: string): Promise<string> {
    return new Promise((res, rej) => {
      const attributeList = [];

      const dataEmail = {
        Name: "email",
        Value: email
      };

      const attributeEmail: any = new CognitoUserAttribute(dataEmail);
      attributeList.push(attributeEmail);

      this.userPool.signUp(username, password, attributeList, [], function(
        err: any,
        result: any
      ) {
        if (err) {
          return rej(err);
        }
        const cognitoUser = result.user;
        res(cognitoUser.getUsername());
      });
    });
  }
}
