import http from '@/utils/http'

const BASE_URL = '/auth/user/sessions'

export interface UserSessionItem {
  tokenId: string
  tokenValue: string
  deviceType: string
  loginIp: string
  loginTime: string
  isCurrent: boolean
}

/** @desc 查询活跃会话列表 */
export function listUserSessions() {
  return http.get<UserSessionItem[]>(BASE_URL)
}

/** @desc 踢出指定会话 */
export function kickoutSession(token: string) {
  return http.del(`${BASE_URL}/${token}`)
}

/** @desc 退出所有其他设备 */
export function kickoutAllSessions() {
  return http.del(BASE_URL)
}
