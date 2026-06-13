import type { LoginResp, MfaSetupResp, MfaStatusResp } from './type'
import http from '@/utils/http'

const BASE_URL = '/auth/mfa'

/** @desc MFA 验证（登录第二步） */
export function mfaVerify(mfaChallengeToken: string, code: string, type = 'totp') {
  return http.post<LoginResp>(`${BASE_URL}/verify`, null, {
    params: { mfa_challenge_token: mfaChallengeToken, code, type },
  })
}

/** @desc 开始绑定 TOTP */
export function mfaSetupInit(mfaChallengeToken?: string) {
  return http.post<MfaSetupResp>(`${BASE_URL}/setup/init`, null, {
    params: mfaChallengeToken ? { mfa_challenge_token: mfaChallengeToken } : undefined,
  })
}

/** @desc 确认绑定 TOTP */
export function mfaSetupConfirm(code: string, mfaChallengeToken?: string) {
  return http.post<string[]>(`${BASE_URL}/setup/confirm`, null, {
    params: mfaChallengeToken
      ? { code, mfa_challenge_token: mfaChallengeToken }
      : { code },
  })
}

/** @desc 解绑 MFA */
export function mfaDisable(code: string) {
  return http.post(`${BASE_URL}/disable`, null, { params: { code } })
}

/** @desc 重新生成恢复码 */
export function mfaRegenerateBackupCodes(code: string) {
  return http.post<string[]>(`${BASE_URL}/backup-codes/regenerate`, null, { params: { code } })
}

/** @desc 查询 MFA 状态 */
export function getMfaStatus() {
  return http.get<MfaStatusResp>(`${BASE_URL}/status`)
}
