import type { MockMethod } from 'vite-plugin-mock'

const mocks: MockMethod[] = [
  {
    url: '/dev-api/oauth2/consent',
    method: 'get',
    response: () => {
      return {
        success: true,
        code: '200',
        msg: '操作成功',
        data: {
          authReqId: 'mock-auth-req-001',
          appName: '内部OA系统',
          logo: '',
          scopes: [
            { code: 'openid', name: '用户唯一标识', description: '获取你的用户 ID' },
            { code: 'profile', name: '基本信息', description: '读取你的昵称和头像' },
            { code: 'email', name: '邮箱地址', description: '获取你的邮箱地址' },
          ],
        },
      }
    },
  },
  {
    url: '/dev-api/oauth2/consent/approve',
    method: 'post',
    response: () => {
      return {
        success: true,
        code: '200',
        msg: '操作成功',
        data: {
          redirectUri: 'https://example.com/callback?code=mock_code_123&state=mock_state',
        },
      }
    },
  },
  {
    url: '/dev-api/oauth2/consent/deny',
    method: 'post',
    response: () => {
      return {
        success: true,
        code: '200',
        msg: '操作成功',
        data: {
          redirectUri: 'https://example.com/callback?error=access_denied&error_description=user_denied&state=mock_state',
        },
      }
    },
  },
]

export default mocks
