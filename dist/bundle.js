var Promise = (function () {
  'use strict';

  class Promise$1 {
      constructor(executor) {
          this.status = "pending" /* PENDING */;
          this.onFulfilledCallbacks = [];
          this.onRejectedCallbacks = [];
          const resolve = (value) => {
              if (this.status === "pending" /* PENDING */) {
                  this.status = "fulfilled" /* FULFILLED */;
                  this.value = value;
                  this.onFulfilledCallbacks.forEach((cb) => cb());
              }
          };
          const reject = (reason) => {
              if (this.status === "pending" /* PENDING */) {
                  this.status = "rejected" /* REJECTED */;
                  this.reason = reason;
                  this.onRejectedCallbacks.forEach((cb) => cb());
              }
          };
          try {
              executor(resolve, reject);
          }
          catch (error) {
              reject(error);
          }
      }
      then(onFulfilled, onRejected) {
          if (this.status === "fulfilled" /* FULFILLED */) {
              onFulfilled(this.value);
          }
          if (this.status === "rejected" /* REJECTED */) {
              onRejected(this.reason);
          }
          if (this.status === "pending" /* PENDING */) {
              this.onFulfilledCallbacks.push(() => {
                  onFulfilled(this.value);
              });
              this.onRejectedCallbacks.push(() => {
                  onRejected(this.reason);
              });
          }
      }
  }

  return Promise$1;

})();
//# sourceMappingURL=bundle.js.map
