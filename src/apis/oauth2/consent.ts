import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/oauth2/consent'

/** @desc 获取授权决策数据（判断是否需要展示确认页） */
export function getConsentInfo(authReqId: string) {
  return http.get<T.Oauth2AuthorizeResp>(`${BASE_URL}`, { auth_req_id: authReqId })
}

/** @desc 用户同意授权 */
export function approveConsent(authReqId: string) {
  const params = new URLSearchParams()
  params.append('auth_req_id', authReqId)
  return http.post<T.Oauth2RedirectResp>(`${BASE_URL}/approve`, params)
}

/** @desc 用户拒绝授权 */
export function denyConsent(authReqId: string) {
  const params = new URLSearchParams()
  params.append('auth_req_id', authReqId)
  return http.post<T.Oauth2RedirectResp>(`${BASE_URL}/deny`, params)
}
