import type { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * @interface 创建实例参数
 */
export interface AxiosCreateOption extends AxiosRequestConfig {
  baseURL: string;
  interceptors?: Interceptors;
  /**
   * @description 是否开启重复请求
   */
  ignoreRepeatRequests?: boolean;
}

/**
 * @interface 拦截器
 */
export interface Interceptors {
  /**
   * @description 请求拦截
   */
  onRequest?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;

  /**
   * @description 响应拦截
   */
  onResponse?: (res: AxiosResponse<ResponseResult>) => AxiosResponse<ResponseResult>;

  /**
   * @description: 请求拦截错误处理
   */
  onRequestError?: (error: AxiosError) => void;

  /**
   * @description: 响应拦截错误处理
   */
  onResponseError?: (error: AxiosError) => void;

  /**
   * @description 请求失败处理
   */
  onErrorCatch?: (err: AxiosError<ResponseResult>) => AxiosError | ResponseResult | undefined;
}

/**
 * @interface 请求数据参数
 */
export interface RequestOptions extends AxiosRequestConfig {
  /**
   * @description 是否开启缓存
   */
  cache?: boolean;
  /**
   * @description 是否开启重复请求
   */
  ignoreRepeatRequests?: boolean;
}

/**
 * @interface 响应数据格式
 */
export interface ResponseResult<T = any> {
  // code: number;
  // method: string;
  // time: string;
  // path: string;
  data: T;
  // token?: string;
  // message?: string;
  request: { [key: string]: any };

   // `status` is the HTTP status code from the server response
   status: number,
 
   // `statusText` is the HTTP status message from the server response
   // As of HTTP/2 status text is blank or unsupported.
   // (HTTP/2 RFC: https://www.rfc-editor.org/rfc/rfc7540#section-8.1.2.4)
   statusText: string,
 
   // `headers` the HTTP headers that the server responded with
   // All header names are lower cased and can be accessed using the bracket notation.
   // Example: `response.headers['content-type']`
   headers: { [key: string]: string },
 
   // `config` is the config that was provided to `axios` for the request
   config: { [key: string]: any },
}
