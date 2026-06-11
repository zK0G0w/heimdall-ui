import type * as T from './type'
import http from '@/utils/http'

export type * from './type'

const BASE_URL = '/oauth2/consent'

/** @desc 获取授权确认页数据 */
export function getConsentInfo(authReqId: string) {
  return http.get<T.Oauth2ConsentInfoResp>(`${BASE_URL}`, { auth_req_id: authReqId })
}

/**
 * @desc 提交授权决策（同意/拒绝）
 * 后端 approve/deny 端点使用 302 重定向，前端通过表单提交让浏览器跟随跳转
 */
export function submitConsentDecision(action: 'approve' | 'deny', authReqId: string) {
  const apiPrefix = import.meta.env.VITE_API_PREFIX || ''
  const url = `${apiPrefix}${BASE_URL}/${action}`
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url

  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = 'auth_req_id'
  input.value = authReqId
  form.appendChild(input)

  document.body.appendChild(form)
  form.submit()
}
