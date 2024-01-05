import { type AxiosRequestConfig } from 'axios';
export declare class AxiosCanceler {
    private pendingMap;
    /**
     * 获取存放map的key值
     * @param config axios请求
     */
    private getCancelerKey;
    /**
     * 增加请求
     * @param config axios请求
     */
    addPending(config: AxiosRequestConfig): void;
    /**
     * 移除请求
     * @param config axios请求
     */
    removePending(config: AxiosRequestConfig): void;
    /**
     *  移除所有请求
     */
    removeAllPending(): void;
}
