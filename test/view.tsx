/**
 * Test script for rendering the view to a test html page for testing manually
 */
import * as React from "react";
import * as ReactDOM from "react-dom";
import { cognitoServiceOptions } from "./config";
import { CognitoView, AuthState, CognitoProps } from "../src/view";

const props = {};
interface AppState {
  count: number;
  authState: AuthState;
}
class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      count: 0,
      authState: AuthState.Unknown
    };
  }
  render() {
    return (
      <div className="container">
        <CognitoView
          onError={(a: any) => {}}
          appName="test-appName"
          cognitoOptions={cognitoServiceOptions}
          onAuthStateChange={(authState: AuthState) => {
            this.setState({ authState });
          }}
          syncData={this.state.count}
          onSyncDataReceived={(count: any) =>
            this.setState({ count: count || 0 })
          }
        />
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 py-3">
            <form>
              <div className="form-group">
                <label>Count</label>
                <input
                  type="number"
                  className="form-control"
                  value={this.state.count}
                  onChange={e =>
                    this.setState({ count: parseInt(e.target.value, 10) })
                  }
                />
              </div>
              <div className="form-group">
                <label>AuthState</label>
                <input
                  type="text"
                  disabled={true}
                  className="form-control"
                  value={this.state.authState}
                />
              </div>
              {this.state.authState == AuthState.LoggedIn && (
                <a className="btn btn-primary">Logout</a>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }
}

const element = ReactDOM.render(<App />, document.getElementById("root"));
