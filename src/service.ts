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
}

enum StorageKey {
  accessToken = "csrm:access-token",
  username = "csrm:username"
}

class Storage {
  static getValue(key: string): string {
    return window.localStorage.getItem(key);
  }
  static setValue(key: string, value: string) {
    window.localStorage.setItem(key, value);
  }
  static clearAll() {
    window.localStorage.clear();
  }
}

export class CognitoService {
  private poolData: { UserPoolId: string; ClientId: string };
  private userPool: CognitoUserPool;
  private syncClient: any;
  private options: CognitoServiceOptions;

  constructor(options: CognitoServiceOptions) {
    this.options = options;

    this.poolData = {
      UserPoolId: this.options.awsUserPoolId,
      ClientId: this.options.awsClientId
    };
    this.userPool = new CognitoUserPool(this.poolData);
  }

  getStoredAccessToken() {
    return Storage.getValue(StorageKey.accessToken);
  }

  getUserData(): Promise<any> {
    return this.getSyncValue(this.options.datasetKey).then(
      res => (res ? JSON.parse(res) : res)
    );
  }

  putUserData(value: any) {
    return this.putSyncValue(this.options.datasetKey, JSON.stringify(value));
  }

  private getSyncClient() {
    const loginId = Storage.getValue(StorageKey.username);
    if (!loginId) {
      throw "No loginId found";
    }

    AWS.config.region = this.options.awsRegion;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: this.options.awsIdentityPoolId,
      LoginId: loginId
    });

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
      Storage.clearAll();
      res();
    });
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
          // store username and accessToken in localStorage
          Storage.setValue(StorageKey.accessToken, accessToken);
          Storage.setValue(StorageKey.username, username);
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
