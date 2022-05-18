import { PROMISE_STATUS } from "./status";
type IExecutor<T> = (onFulfilled: Resolve<T>, onRejected: Reject<T>) => void;
type Resolve<T> = (value: T) => void;
type Reject<T> = (reason: T) => void;
type OnFulfilled<T> = (value?: T) => void;
type OnRejected<T> = (reason?: T) => void;
class Promise<T> {
  status: PROMISE_STATUS = PROMISE_STATUS.PENDING;

  value?: T; // value | reason
  reason?: T;

  onFulfilledCallbacks: OnFulfilled<T>[] = [];
  onRejectedCallbacks: OnRejected<T>[] = [];

  constructor(executor: IExecutor<T>) {
    const resolve: Resolve<T> = (value: T) => {
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
  then(onFulfilled: OnFulfilled<T>, onRejected: OnRejected<T>) {
    if (this.status === PROMISE_STATUS.FULFILLED) {
      onFulfilled(this.value);
    }
    if (this.status === PROMISE_STATUS.REJECTED) {
      onRejected(this.reason);
    }
    if (this.status === PROMISE_STATUS.PENDING) {
      this.onFulfilledCallbacks.push(() => {
        onFulfilled(this.value);
      });
      this.onRejectedCallbacks.push(() => {
        onRejected(this.reason);
      });
    }
  }
}

export default Promise;
