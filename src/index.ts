import axios, {
    AxiosError,
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
  } from 'axios';
import { AxiosCanceler } from './AxiosCanceler';
import type { AxiosCreateOption, RequestOptions, ResponseResult } from './index.interface';
import { CacheManager } from './CacheManager';
import { sessionCache } from '@hps/cache'
import { getToken } from "./help";
import qs from 'qs';




axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
  
  /**
   * @description 封装axios 调用getInstance获取实例
   */
  export class HttpRequest {
    public axiosInstance: AxiosInstance;
    public createOptions: AxiosCreateOption;
    public axiosCanceler: AxiosCanceler = new AxiosCanceler();
    public cacheManager: CacheManager = new CacheManager();
  
    constructor(createOptions: AxiosCreateOption) {
      this.axiosInstance = axios.create(createOptions);
      console.log(this, 'this.axiosInstance')
      this.createOptions = createOptions;
      this.setInterceports();
    }
  
    /**
     * @description 设置拦截器和取消请求
     */
    private setInterceports(): void {

      this.axiosInstance.interceptors.request.use(
        (config) => {
          // 是否需要设置 token
          const isToken = (config.headers || {}).isToken === false
          // 是否需要防止数据重复提交
          const isRepeatSubmit = (config.headers || {}).repeatSubmit === false
          if (getToken() && !isToken) {
            config.headers['Authorization'] = 'Bearer ' + getToken() // 让每个请求携带自定义token 请根据实际情况自行修改
          }
          // get请求映射params参数
          if (config.method === 'get' && config.params) {
            let url = config.url + '?' + qs.stringify(config.params)
            // url = url.slice(0, -1)
            config.params = {}
            config.url = url
          }
          console.log(!isRepeatSubmit, 'isRepeatSubmit')
          if (
            !isRepeatSubmit &&
            (config.method === 'post' || config.method === 'put')
          ) {
            const requestObj = {
              url: config.url,
              data:
                typeof config.data === 'object'
                  ? JSON.stringify(config.data)
                  : config.data,
              time: new Date().getTime()
            }
            const sessionObj = sessionCache.getJSON('sessionObj')
            if (
              sessionObj === undefined ||
              sessionObj === null ||
              sessionObj === ''
            ) {
              sessionCache.setJSON('sessionObj', requestObj)
            } else {
              const s_url = sessionObj.url // 请求地址
              const s_data = sessionObj.data // 请求数据
              const s_time = sessionObj.time // 请求时间
              const interval = 1000 // 间隔时间(ms)，小于此时间视为重复提交
              if (
                s_data === requestObj.data &&
                requestObj.time - s_time < interval &&
                s_url === requestObj.url
              ) {
                const message = '数据正在处理，请勿重复提交'
                console.warn(`[${s_url}]: ` + message)
                return Promise.reject(new Error(message))
              } else {
                sessionCache.setJSON('sessionObj', requestObj)
              }
            }
          }
          return config
        },
        (error) => {
          console.log(error)
          Promise.reject(error)
        }
      )
  
      this.axiosInstance.interceptors.response.use((res: AxiosResponse<ResponseResult>) => {
        
        // if (this.createOptions.interceptors?.onResponse) {
        //   res = this.createOptions.interceptors.onResponse(res);
        // }
        
        return res;
      },  (error) => {
        return Promise.resolve(error.response);
      });
    }
  
    /**
     * @description 移除所有请求
     */
    public allRequestCanceler(): void {
      this.axiosCanceler.removeAllPending();
    }
  
    /**
     * @param config axios请求数据
     */
    public request<T = any>(config: RequestOptions): Promise<ResponseResult<T>> {
      console.log(this, 'this.axiosInstance2')
      return new Promise(async (resolve, reject) => {
        // 判断是否开启缓存
        if (config.cache) {
          const cacheData = this.cacheManager.get<T>(config);
          // 不等于undefined意味着已经有正在pending状态了
          if (cacheData !== undefined) {
            try {
              return resolve(await cacheData);
            } catch (err) {
              return reject(err);
            }
          }
        }
        console.log(this, 'this.axiosInstance1')
        this.axiosInstance
          .request(config)
          .then((res: AxiosResponse<ResponseResult>) => {
            console.log(res, 'reskkkk')
            config.cache && this.cacheManager.set(config, res.data, 'success');
            resolve(res.data as ResponseResult<T>);
          })
          .catch((err: AxiosError<ResponseResult>) => {
            if (this.createOptions.interceptors?.onErrorCatch) {
              const newErr = this.createOptions.interceptors?.onErrorCatch(err);
              config.cache && this.cacheManager.set(config, newErr, 'error');
              return reject(newErr);
            }
            config.cache && this.cacheManager.set(config, err, 'error');
            reject(err);
          });
      });
    }
    public get<T = any>(
      url: string,
      config?: RequestOptions
    ): Promise<ResponseResult<T> | AxiosResponse<ResponseResult<T>>> {
      return this.request<T>({ ...config, url, method: 'get' });
    }
    public post<T = any>(
      url: string,
      data?: any,
      config?: RequestOptions
    ): Promise<ResponseResult<T> | AxiosResponse<ResponseResult<T>>> {
      return this.request<T>({ ...config, url, data, method: 'post' });
    }
    public put<T = any>(
      url: string,
      data?: any,
      config?: RequestOptions
    ): Promise<ResponseResult<T> | AxiosResponse<ResponseResult<T>>> {
      return this.request<T>({ ...config, url, data, method: 'put' });
    }
    public delete<T = any>(
      url: string,
      config?: RequestOptions
    ): Promise<ResponseResult<T> | AxiosResponse<ResponseResult<T>>> {
      return this.request<T>({ ...config, url, method: 'delete' });
    }
    public upload<T = any>(
      url: string,
      data?: any,
      config?: RequestOptions
    ): Promise<ResponseResult<T> | AxiosResponse<ResponseResult<T>>> {
      return this.request<T>({
        ...config,
        url,
        data,
        method: 'post',
        headers: { 'Content-Type': 'multipart/form-data', ...config?.headers },
      });
    }
  }
  