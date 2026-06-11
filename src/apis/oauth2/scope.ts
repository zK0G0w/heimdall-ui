import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/oauth2/scope'

/** @desc 查询全量 Scope 列表 */
export function listScope() {
  return http.get<T.Oauth2ScopeResp[]>(`${BASE_URL}`)
}

/** @desc 新增 Scope */
export function addScope(data: any) {
  return http.post(`${BASE_URL}`, data)
}

/** @desc 修改 Scope */
export function updateScope(data: any, id: number) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 批量删除 Scope */
export function deleteScope(id: number) {
  return http.del(`${BASE_URL}`, { ids: [id] })
}
