import { localCache } from '@hps/cache'
import axios, {
    AxiosError,
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
  } from 'axios';
import { AxiosCanceler } from './AxiosCanceler';
import type { AxiosCreateOption, RequestOptions, ResponseResult } from './index.interface';


/**
 * @description 获取token
 */

export function getToken() {
    console.log(Cache, 'kkkkk')
    return localCache.get('token')
}

