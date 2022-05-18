# 实现promise A+规范

## 安装test库

```shell
pnpm i promises-aplus-tests -D
```

配置test条件

```js
Promise.deferred = function(){
  const dfd = {}
  dfd.promise = new Promise((resolve,reject)=>{
      dfd.resolve = resolve
      dfd.reject = reject
  })
  return dfd;
}
```

测试命令：
```shell
npx promises-aplus-tests xxx.js
```
