import { defineMock } from './_base'

export default defineMock([
  {
    url: '/oauth2/consent',
    method: 'get',
    response: () => {
      return {
        success: true,
        code: '200',
        msg: '操作成功',
        data: {
          authReqId: 'mock-auth-req-001',
          appName: '内部OA系统',
          appLogo: '',
          appDescription: '公司内部办公协作平台',
          scopes: [
            { scopeCode: 'openid', scopeName: '用户唯一标识', description: '获取你的用户 ID' },
            { scopeCode: 'profile', scopeName: '基本信息', description: '读取你的昵称和头像' },
            { scopeCode: 'email', scopeName: '邮箱地址', description: '获取你的邮箱地址' },
          ],
        },
      }
    },
  },
  {
    url: '/oauth2/consent/approve',
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
    url: '/oauth2/consent/deny',
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
])
