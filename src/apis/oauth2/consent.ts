import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/oauth2/consent'

/** @desc 获取授权确认页数据 */
export function getConsentInfo(authReqId: string) {
  return http.get<T.Oauth2ConsentInfoResp>(`${BASE_URL}`, { auth_req_id: authReqId })
}

/** @desc 用户同意授权 */
export function approveConsent(data: T.Oauth2ConsentDecisionReq) {
  return http.post<T.Oauth2ConsentDecisionResp>(`${BASE_URL}/approve`, data)
}

/** @desc 用户拒绝授权 */
export function denyConsent(data: T.Oauth2ConsentDecisionReq) {
  return http.post<T.Oauth2ConsentDecisionResp>(`${BASE_URL}/deny`, data)
}
