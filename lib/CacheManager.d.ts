import type { AxiosRequestConfig } from 'axios';
import type { ResponseResult } from './index.interface';
export type CacheStatus = 'pending' | 'complete';
export type CacheCallBackType = 'success' | 'error';
export interface Cache {
    status: CacheStatus;
    res?: ResponseResult;
    callback: {
        resolve: (data: any) => void;
        reject: (error: any) => void;
    }[];
}
export declare class CacheManager {
    private cacheMap;
    /**
     * 根据请求生成key
     * @param config axios请求
     */
    getCacheKey(config: AxiosRequestConfig): string;
    /**
     * 获取缓存
     * @param config axios请求
     */
    get<T = any>(config: AxiosRequestConfig): Promise<ResponseResult<T>> | undefined;
    /**
     * 设置缓存
     * @param config axios请求
     * @param res 接口数据
     * @param cacheCallBackType Promise回调类型
     */
    set(config: AxiosRequestConfig, res: any, cacheCallBackType: CacheCallBackType): void;
}
