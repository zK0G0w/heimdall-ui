import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/oauth2/app'

/** @desc 分页查询应用列表 */
export function listApp(query: T.Oauth2AppPageQuery) {
  return http.get<PageRes<T.Oauth2AppResp[]>>(`${BASE_URL}`, query)
}

/** @desc 查询应用详情 */
export function getApp(id: number) {
  return http.get<T.Oauth2AppDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增应用 */
export function addApp(data: any) {
  return http.post(`${BASE_URL}`, data)
}

/** @desc 修改应用 */
export function updateApp(data: any, id: number) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 批量删除应用 */
export function deleteApp(id: number) {
  return http.del(`${BASE_URL}`, { ids: [id] })
}

/** @desc 修改应用状态 */
export function updateAppStatus(id: number, status: number) {
  return http.put(`${BASE_URL}/${id}/status`, { status })
}

/** @desc 查询密钥列表 */
export function listAppSecret(appId: number) {
  return http.get<T.Oauth2AppSecretResp[]>(`${BASE_URL}/${appId}/secret`)
}

/** @desc 创建密钥 */
export function createAppSecret(appId: number) {
  return http.post<T.Oauth2AppSecretCreateResp>(`${BASE_URL}/${appId}/secret`)
}

/** @desc 删除密钥 */
export function deleteAppSecret(appId: number, secretId: number) {
  return http.del(`${BASE_URL}/${appId}/secret/${secretId}`)
}

/** @desc 修改回调地址 */
export function updateAppRedirectUris(appId: number, uris: string[]) {
  return http.put(`${BASE_URL}/${appId}/redirect-uri`, { uris })
}

/** @desc 修改 Scope */
export function updateAppScopes(appId: number, scopeIds: number[]) {
  return http.put(`${BASE_URL}/${appId}/scope`, { scopeIds })
}
