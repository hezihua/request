import { type AxiosInstance, type AxiosResponse } from 'axios';
import { AxiosCanceler } from './AxiosCanceler';
import type { AxiosCreateOption, RequestOptions, ResponseResult } from './index.interface';
import { CacheManager } from './CacheManager';
/**
 * @description 封装axios 调用getInstance获取实例
 */
export declare class HttpRequest {
    axiosInstance: AxiosInstance;
    createOptions: AxiosCreateOption;
    axiosCanceler: AxiosCanceler;
    cacheManager: CacheManager;
    constructor(createOptions: AxiosCreateOption);
    /**
     * @description 设置拦截器和取消请求
     */
    private setInterceports;
    /**
     * @description 移除所有请求
     */
    allRequestCanceler(): void;
    /**
     * @param config axios请求数据
     */
    request<T = any>(config: RequestOptions): Promise<ResponseResult<T>>;
    get<T = any>(url: string, config?: RequestOptions): Promise<ResponseResult<T> | AxiosResponse<ResponseResult<T>>>;
    post<T = any>(url: string, data?: any, config?: RequestOptions): Promise<ResponseResult<T> | AxiosResponse<ResponseResult<T>>>;
    put<T = any>(url: string, data?: any, config?: RequestOptions): Promise<ResponseResult<T> | AxiosResponse<ResponseResult<T>>>;
    delete<T = any>(url: string, config?: RequestOptions): Promise<ResponseResult<T> | AxiosResponse<ResponseResult<T>>>;
    upload<T = any>(url: string, data?: any, config?: RequestOptions): Promise<ResponseResult<T> | AxiosResponse<ResponseResult<T>>>;
}
