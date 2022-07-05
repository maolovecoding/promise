import { PROMISE_STATUS } from "./status";
type IExecutor<T = any> = (
  onFulfilled: Resolve<T>,
  onRejected: Reject<T>
) => void;
type Resolve<T = any> = (value: T) => any;
type Reject<T = any> = (reason: T) => any;
type OnFulfilled<T = any> = (value?: T) => any;
type OnRejected<T = any> = (reason?: T) => any;

const doWithCatch = <T = any>(
  resolve: Resolve,
  reject: Reject,
  value: T,
  onFulfilledOrRejected: OnFulfilled | OnRejected
) => {
  try {
    const res = onFulfilledOrRejected(value);
    resolve(res);
  } catch (error) {
    reject(error);
  }
};
/**
 * 判断value和promise的关系 决定走成功还是失败
 */
function resolvePromise<T>(
  promise2: Promise<T>,
  x: T | Promise<T>,
  resolve: Resolve,
  reject: Reject
) {
  // 如果 x 是一个普通值 直接调用resolve即可
  // 如果 x 是一个新的promise的对象，则promise2的状态需要和res的状态一致

  // 自己等着自己的状态
  if (promise2 === x) {
    reject(
      new TypeError(
        `[TypeError: Chaining cycle detected for promise #<Promise>]`
      )
    );
  }
  // 判断 x 是否是promise实例 -> x有没有then方法
  if ((x != null && typeof x === "object") || typeof x === "function") {
    let called = false; // promise的状态已经改变过 则不可再次改变状态
    // 取出 then方法
    try {
      // 取出then的过程可能报错
      let then = (x as Promise<T>).then;
      if (typeof then === "function") {
        // 用上次取出来的then方法，而不是 x.then 防止二次取值出现错误
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y!, resolve, reject);
          },
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } else {
        // {} {then:'123'}
        resolve(x);
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(error);
    }
  } else {
    resolve(x); // 普通值 直接成功即可
  }
}

class Promise<T> {
  status: PROMISE_STATUS = PROMISE_STATUS.PENDING;

  value?: T; // value | reason
  reason?: T;

  onFulfilledCallbacks: OnFulfilled<T>[] = [];
  onRejectedCallbacks: OnRejected<T>[] = [];

  constructor(executor: IExecutor<T>) {
    const resolve: Resolve<T> = (value: T) => {
      // 添加一个promise A+规范外的逻辑
      // value值是一个promise的情况下，会解析promise的状态
      if (value instanceof Promise) {
        // 递归解析值
        return value.then(resolve, reject);
      }
      if (this.status === PROMISE_STATUS.PENDING) {
        this.status = PROMISE_STATUS.FULFILLED;
        this.value = value;
        this.onFulfilledCallbacks.forEach((cb) => cb());
      }
    };
    const reject: Reject<T> = (reason: T) => {
      if (this.status === PROMISE_STATUS.PENDING) {
        this.status = PROMISE_STATUS.REJECTED;
        this.reason = reason;
        this.onRejectedCallbacks.forEach((cb) => cb());
      }
    };
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error as any);
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
  then(onFulfilled?: OnFulfilled<T>, onRejected?: OnRejected<T>) {
    onFulfilled = typeof onFulfilled === "function" ? onFulfilled : (v) => v;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (r) => {
            throw r;
          };
    const promise2 = new Promise<T>((resolve, reject) => {
      if (this.status === PROMISE_STATUS.FULFILLED) {
        queueMicrotask(() => {
          try {
            const res = onFulfilled!(this.value);
            resolvePromise(promise2, res, resolve, reject);
          } catch (error) {
            reject(error as any);
          }
        });
      }
      if (this.status === PROMISE_STATUS.REJECTED) {
        queueMicrotask(() => {
          try {
            const res = onRejected!(this.reason);
            resolvePromise(promise2, res, resolve, reject);
          } catch (error) {
            reject(error as any);
          }
        });
      }
      if (this.status === PROMISE_STATUS.PENDING) {
        this.onFulfilledCallbacks.push(() => {
          queueMicrotask(() => {
            try {
              const res = onFulfilled!(this.value);
              resolvePromise(promise2, res, resolve, reject);
            } catch (error) {
              reject(error as any);
            }
          });
        });
        this.onRejectedCallbacks.push(() => {
          queueMicrotask(() => {
            try {
              const res = onRejected!(this.reason);
              resolvePromise(promise2, res, resolve, reject);
            } catch (error) {
              reject(error as any);
            }
          });
        });
      }
    });
    return promise2;
  }
  catch(errorCallback: OnRejected) {
    return this.then(void 0, errorCallback);
  }
  finally(finallyCallback: () => any) {
    return this.then(
      // 如果成功和失败的回调返回一个promise 需要等待
      (value) => {
        // 将值向下传递
        return Promise.resolve(finallyCallback()).then(() => value);
      },
      (reason) => {
        return Promise.resolve(finallyCallback()).catch(() => {
          throw reason;
        });
      }
    );
  }
  // resolve 参数如果是一个promise的话会有等待效果 reject没有等待效果
  static resolve = <T>(value: T) => {
    return new Promise<T>((resolve, reject) => {
      resolve(value);
    });
  };
  static reject = <T>(reason: T) => {
    return new Promise<T>((resolve, reject) => {
      reject(reason);
    });
  };
  static all<T>(promises: Promise<T>[] | any[]) {
    return new Promise((resolve, reject) => {
      const res: T[] = [];
      let times = 0;
      const processData = (key: number, value: T) => {
        res[key] = value;
        if (promises.length === ++times) {
          resolve(res);
        }
      };
      for (let i = 0; i < promises.length; i++) {
        Promise.resolve(promises[i]).then((value) => {
          processData(i, value);
        }, reject);
      }
    });
  }
  static race<T>(promises: Promise<T>[] | any[]) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        Promise.resolve(promises[i]).then(resolve, reject);
      }
    });
  }
  get [Symbol.toStringTag]() {
    return "Promise";
  }
}

export default Promise;
