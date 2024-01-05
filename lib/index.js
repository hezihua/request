import axios from 'axios';
import { localCache, sessionCache } from '@hps/cache';
import qs from 'qs';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class AxiosCanceler {
    constructor() {
        this.pendingMap = new Map();
    }
    /**
     * 获取存放map的key值
     * @param config axios请求
     */
    getCancelerKey(config) {
        if (config.params) {
            return [config.method, config.url, ...Object.keys(config.params)].join('&');
        }
        else if (config.data) {
            return [config.method, config.url, ...Object.keys(config.data)].join('&');
        }
        return [config.method, config.url].join('&');
    }
    /**
     * 增加请求
     * @param config axios请求
     */
    addPending(config) {
        // 取消重复请求
        this.removePending(config);
        const controller = new AbortController();
        const key = this.getCancelerKey(config);
        if (!this.pendingMap.has(key)) {
            this.pendingMap.set(key, controller);
        }
        // config.cancelToken = new axios.CancelToken((cancel: Canceler) => {
        //   const key = this.getCancelerKey(config);
        //   if (!this.pendingMap.has(key)) {
        //     this.pendingMap.set(key, cancel);
        //   }
        // });
    }
    /**
     * 移除请求
     * @param config axios请求
     */
    removePending(config) {
        const key = this.getCancelerKey(config);
        const controller = this.pendingMap.get(key);
        controller && controller.abort();
        this.pendingMap.delete(key);
    }
    /**
     *  移除所有请求
     */
    removeAllPending() {
        this.pendingMap.forEach((controller) => {
            controller && controller.abort();
        });
        this.pendingMap.clear();
    }
}

class CacheManager {
    constructor() {
        this.cacheMap = new Map();
    }
    /**
     * 根据请求生成key
     * @param config axios请求
     */
    getCacheKey(config) {
        if (config.params) {
            return [config.method, config.url, ...Object.keys(config.params)].join('&');
        }
        else if (config.data) {
            return [config.method, config.url, ...Object.keys(config.data)].join('&');
        }
        return [config.method, config.url].join('&');
    }
    /**
     * 获取缓存
     * @param config axios请求
     */
    get(config) {
        const key = this.getCacheKey(config);
        const cache = this.cacheMap.get(key);
        if (cache) {
            if (cache.status === 'complete') {
                return Promise.resolve(cache.res);
            }
            if (cache.status === 'pending') {
                return new Promise((resolve, reject) => {
                    cache.callback.push({
                        resolve,
                        reject,
                    });
                });
            }
        }
        this.cacheMap.set(key, {
            status: 'pending',
            callback: [],
        });
    }
    /**
     * 设置缓存
     * @param config axios请求
     * @param res 接口数据
     * @param cacheCallBackType Promise回调类型
     */
    set(config, res, cacheCallBackType) {
        const key = this.getCacheKey(config);
        const cache = this.cacheMap.get(key);
        if (cache) {
            if (cacheCallBackType === 'success') {
                cache.res = res;
                cache.status = 'complete';
                for (let i = 0; i < cache.callback.length; i++) {
                    cache.callback[i].resolve(res);
                    cache.callback.splice(i, 1);
                    i--;
                }
            }
            else if (cacheCallBackType === 'error') {
                for (let i = 0; i < cache.callback.length; i++) {
                    cache.callback[i].reject(res);
                    cache.callback.splice(i, 1);
                    i--;
                }
                this.cacheMap.delete(key);
            }
        }
    }
}

/**
 * @description 获取token
 */
function getToken() {
    console.log(Cache, 'kkkkk');
    return localCache.get('token');
}

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
/**
 * @description 封装axios 调用getInstance获取实例
 */
class HttpRequest {
    constructor(createOptions) {
        this.axiosCanceler = new AxiosCanceler();
        this.cacheManager = new CacheManager();
        this.axiosInstance = axios.create(createOptions);
        console.log(this, 'this.axiosInstance');
        this.createOptions = createOptions;
        this.setInterceports();
    }
    /**
     * @description 设置拦截器和取消请求
     */
    setInterceports() {
        this.axiosInstance.interceptors.request.use((config) => {
            // 是否需要设置 token
            const isToken = (config.headers || {}).isToken === false;
            // 是否需要防止数据重复提交
            const isRepeatSubmit = (config.headers || {}).repeatSubmit === false;
            if (getToken() && !isToken) {
                config.headers['Authorization'] = 'Bearer ' + getToken(); // 让每个请求携带自定义token 请根据实际情况自行修改
            }
            // get请求映射params参数
            if (config.method === 'get' && config.params) {
                let url = config.url + '?' + qs.stringify(config.params);
                // url = url.slice(0, -1)
                config.params = {};
                config.url = url;
            }
            console.log(!isRepeatSubmit, 'isRepeatSubmit');
            if (!isRepeatSubmit &&
                (config.method === 'post' || config.method === 'put')) {
                const requestObj = {
                    url: config.url,
                    data: typeof config.data === 'object'
                        ? JSON.stringify(config.data)
                        : config.data,
                    time: new Date().getTime()
                };
                const sessionObj = sessionCache.getJSON('sessionObj');
                if (sessionObj === undefined ||
                    sessionObj === null ||
                    sessionObj === '') {
                    sessionCache.setJSON('sessionObj', requestObj);
                }
                else {
                    const s_url = sessionObj.url; // 请求地址
                    const s_data = sessionObj.data; // 请求数据
                    const s_time = sessionObj.time; // 请求时间
                    const interval = 1000; // 间隔时间(ms)，小于此时间视为重复提交
                    if (s_data === requestObj.data &&
                        requestObj.time - s_time < interval &&
                        s_url === requestObj.url) {
                        const message = '数据正在处理，请勿重复提交';
                        console.warn(`[${s_url}]: ` + message);
                        return Promise.reject(new Error(message));
                    }
                    else {
                        sessionCache.setJSON('sessionObj', requestObj);
                    }
                }
            }
            return config;
        }, (error) => {
            console.log(error);
            Promise.reject(error);
        });
        this.axiosInstance.interceptors.response.use((res) => {
            // if (this.createOptions.interceptors?.onResponse) {
            //   res = this.createOptions.interceptors.onResponse(res);
            // }
            return res;
        }, (error) => {
            return Promise.resolve(error.response);
        });
    }
    /**
     * @description 移除所有请求
     */
    allRequestCanceler() {
        this.axiosCanceler.removeAllPending();
    }
    /**
     * @param config axios请求数据
     */
    request(config) {
        console.log(this, 'this.axiosInstance2');
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            // 判断是否开启缓存
            if (config.cache) {
                const cacheData = this.cacheManager.get(config);
                // 不等于undefined意味着已经有正在pending状态了
                if (cacheData !== undefined) {
                    try {
                        return resolve(yield cacheData);
                    }
                    catch (err) {
                        return reject(err);
                    }
                }
            }
            console.log(this, 'this.axiosInstance1');
            this.axiosInstance
                .request(config)
                .then((res) => {
                console.log(res, 'reskkkk');
                config.cache && this.cacheManager.set(config, res.data, 'success');
                resolve(res.data);
            })
                .catch((err) => {
                var _a, _b;
                if ((_a = this.createOptions.interceptors) === null || _a === void 0 ? void 0 : _a.onErrorCatch) {
                    const newErr = (_b = this.createOptions.interceptors) === null || _b === void 0 ? void 0 : _b.onErrorCatch(err);
                    config.cache && this.cacheManager.set(config, newErr, 'error');
                    return reject(newErr);
                }
                config.cache && this.cacheManager.set(config, err, 'error');
                reject(err);
            });
        }));
    }
    get(url, config) {
        return this.request(Object.assign(Object.assign({}, config), { url, method: 'get' }));
    }
    post(url, data, config) {
        return this.request(Object.assign(Object.assign({}, config), { url, data, method: 'post' }));
    }
    put(url, data, config) {
        return this.request(Object.assign(Object.assign({}, config), { url, data, method: 'put' }));
    }
    delete(url, config) {
        return this.request(Object.assign(Object.assign({}, config), { url, method: 'delete' }));
    }
    upload(url, data, config) {
        return this.request(Object.assign(Object.assign({}, config), { url,
            data, method: 'post', headers: Object.assign({ 'Content-Type': 'multipart/form-data' }, config === null || config === void 0 ? void 0 : config.headers) }));
    }
}

export { HttpRequest };
//# sourceMappingURL=index.js.map
