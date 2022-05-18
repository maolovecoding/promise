var Promise = (function () {
  'use strict';

  /**
   * 判断value和promise的关系 决定走成功还是失败
   */
  function resolvePromise(promise2, x, resolve, reject) {
      // 如果 x 是一个普通值 直接调用resolve即可
      // 如果 x 是一个新的promise的对象，则promise2的状态需要和res的状态一致
      // 自己等着自己的状态
      if (promise2 === x) {
          reject(new TypeError(`[TypeError: Chaining cycle detected for promise #<Promise>]`));
      }
      // 判断 x 是否是promise实例 -> x有没有then方法
      if ((x != null && typeof x === "object") || typeof x === "function") {
          let called = false; // promise的状态已经改变过 则不可再次改变状态
          // 取出 then方法
          try {
              // 取出then的过程可能报错
              let then = x.then;
              if (typeof then === "function") {
                  // 用上次取出来的then方法，而不是 x.then 防止二次取值出现错误
                  then.call(x, (y) => {
                      if (called)
                          return;
                      called = true;
                      resolvePromise(promise2, y, resolve, reject);
                  }, (r) => {
                      if (called)
                          return;
                      called = true;
                      reject(r);
                  });
              }
              else {
                  // {} {then:'123'}
                  resolve(x);
              }
          }
          catch (error) {
              if (called)
                  return;
              called = true;
              reject(error);
          }
      }
      else {
          resolve(x); // 普通值 直接成功即可
      }
  }
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
      /**
       * then 方法的返回值有三种：
       * 1. 返回值是一个新的promise，
       * 外层的下一次then会用这个promise的成功和失败来决定自身走成功还是失败的回调
       * 2. 返回的是一个普通值（不是promise），就会执行下一次then成功回调（会把返回值向下传递）
       * 3. 如果抛出异常，会走下一次的then的失败
       *
       * 什么情况会走下一次的失败： 返回值是一个失败的promise 或者 抛出错误
       * 如果返回的是成功的promise或者是一个普通值 走成功
       * @param onFulfilled
       * @param onRejected
       */
      then(onFulfilled, onRejected) {
          const promise2 = new Promise$1((resolve, reject) => {
              if (this.status === "fulfilled" /* FULFILLED */) {
                  queueMicrotask(() => {
                      try {
                          const res = onFulfilled(this.value);
                          resolvePromise(promise2, res, resolve, reject);
                      }
                      catch (error) {
                          reject(error);
                      }
                  });
              }
              if (this.status === "rejected" /* REJECTED */) {
                  queueMicrotask(() => {
                      try {
                          const res = onRejected(this.reason);
                          resolvePromise(promise2, res, resolve, reject);
                      }
                      catch (error) {
                          reject(error);
                      }
                  });
              }
              if (this.status === "pending" /* PENDING */) {
                  this.onFulfilledCallbacks.push(() => {
                      queueMicrotask(() => {
                          try {
                              const res = onFulfilled(this.value);
                              resolvePromise(promise2, res, resolve, reject);
                          }
                          catch (error) {
                              reject(error);
                          }
                      });
                  });
                  this.onRejectedCallbacks.push(() => {
                      queueMicrotask(() => {
                          try {
                              const res = onRejected(this.reason);
                              resolvePromise(promise2, res, resolve, reject);
                          }
                          catch (error) {
                              reject(error);
                          }
                      });
                  });
              }
          });
          return promise2;
      }
      get [Symbol.toStringTag]() {
          return "Promise";
      }
  }

  return Promise$1;

})();
//# sourceMappingURL=bundle.js.map
