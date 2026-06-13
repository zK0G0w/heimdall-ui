import http from '@/utils/http'

const BASE_URL = '/auth/user/grants'

export interface UserGrantItem {
  appId: number
  appName: string
  clientId: string
  logo: string
  scope: string
  grantedAt: string
  updatedAt: string
}

/** @desc 查询已授权应用列表 */
export function listUserGrants() {
  return http.get<UserGrantItem[]>(BASE_URL)
}

/** @desc 撤销指定应用的授权 */
export function revokeGrant(appId: number) {
  return http.del(`${BASE_URL}/${appId}`)
}

/** @desc 撤销所有应用的授权 */
export function revokeAllGrants() {
  return http.del(BASE_URL)
}
