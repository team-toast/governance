import React, { Component } from "react";

import "../layout/components/progressbar.sass";

class ProgressBar extends Component {
  render() {
    return (
      <div id="progressBar">
        <div className="max-width flex">
          <div className="process-name text-center">
            <img src="/converting-icon.svg" />
            <br />
            <br />
            Converting
          </div>
          {this.props.processStage.length < 4 ? (
            <div className="flex steps">
              <div
                className={
                  this.props.processStage.length >= 1 ? "done" : "none"
                }
              >
                <div className="text-center">
                  <div className="progress-circle"></div>
                  Approved
                </div>
              </div>
              <div
                className={
                  this.props.processStage.length >= 2 ? "done" : "none"
                }
              >
                <div className="text-center">
                  <div className="progress-circle"></div>
                  {this.props.firetext}
                </div>
              </div>
              <div
                className={
                  this.props.processStage.length >= 3 ? "done" : "none"
                }
              >
                <div className="text-center">
                  <div className="progress-circle"></div>
                  Complete
                </div>
              </div>
            </div>
          ) : (
            <div className="flex steps">
              <div className="busy">
                <div className="text-center">
                  <div className="progress-circle"></div>
                  Approved
                </div>
              </div>
              <div className="busy">
                <div className="text-center">
                  <div className="progress-circle"></div>
                  {this.props.firetext}
                </div>
              </div>
              <div className="done error">
                <div className="text-center">
                  <div className="progress-circle"></div>
                  Could not complete. Please try again.
                </div>
              </div>
            </div>
          )}
        </div>
        {this.props.processStage.length === 3 ||
          (this.props.processStage.length === 4 && (
            <button onClick={() => this.props.setStatus("", false)}>X</button>
          ))}
      </div>
    );
  }
}

export default ProgressBar;
