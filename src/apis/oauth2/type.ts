/** OAuth2 应用类型枚举：1=Web应用, 2=移动应用, 3=服务端应用 */
export type AppTypeEnum = 1 | 2 | 3

/** OAuth2 应用列表项 */
export interface Oauth2AppResp {
  id: number
  appName: string
  appType: AppTypeEnum
  clientId: string
  description: string
  status: 1 | 2
  createUserString: string
  createTime: string
  disabled?: boolean
}

/** OAuth2 Scope */
export interface Oauth2ScopeResp {
  id: number
  scopeCode: string
  scopeName: string
  description: string
  createUserString: string
  createTime: string
}

/** OAuth2 应用详情（含密钥、授权等配置） */
export interface Oauth2AppDetailResp extends Oauth2AppResp {
  logo: string
  accessTokenTtl: number
  refreshTokenTtl: number
  allowSilentAuth: boolean
  allowedGrantTypes: string
  redirectUris: string[]
  scopes: Oauth2ScopeResp[]
  updateUserString: string
  updateTime: string
}

/** OAuth2 应用查询参数 */
export interface Oauth2AppQuery {
  appName?: string
  appType?: number
  status?: number
  sort: Array<string>
}

/** OAuth2 应用分页查询参数 */
export interface Oauth2AppPageQuery extends Oauth2AppQuery, PageQuery {}

/** OAuth2 应用密钥列表项 */
export interface Oauth2AppSecretResp {
  id: number
  clientSecret: string
  status: 1 | 2
  expiresAt: string
  createTime: string
}

/** 创建密钥后返回的明文密钥 */
export interface Oauth2AppSecretCreateResp {
  id: number
  clientSecret: string
}
