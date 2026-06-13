<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import axios from 'axios'
import { useRoute } from 'vue-router'

defineOptions({ name: 'Oauth2Callback' })

const route = useRoute()

const clientConfig = reactive({
  clientId: 'acb0588ffbb34b96b50d7f767d499779',
  clientSecret: '',
  redirectUri: 'http://localhost:5173/oauth2/callback',
})

const code = computed(() => (route.query.code as string) || '')
const state = computed(() => (route.query.state as string) || '')
const errorParam = computed(() => (route.query.error as string) || '')
const errorDesc = computed(() => (route.query.error_description as string) || '')

const loading = ref(false)
const tokenResult = ref<any>(null)
const userInfoResult = ref<any>(null)
const tokenError = ref('')

const rawHttp = axios.create({
  baseURL: import.meta.env.VITE_API_PREFIX ?? import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
})

const exchangeToken = async () => {
  if (!code.value) return
  if (!clientConfig.clientSecret) {
    Message.warning('请填写 Client Secret')
    return
  }
  loading.value = true
  tokenError.value = ''
  tokenResult.value = null
  userInfoResult.value = null
  try {
    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('code', code.value)
    params.append('client_id', clientConfig.clientId)
    params.append('client_secret', clientConfig.clientSecret)
    params.append('redirect_uri', clientConfig.redirectUri)

    const { data } = await rawHttp.post('/oauth2/token', params)
    tokenResult.value = data
  } catch (e: any) {
    const respData = e?.response?.data
    if (respData?.error) {
      tokenError.value = `${respData.error}: ${respData.error_description || '未知错误'}`
    } else {
      tokenError.value = e?.message || '换码失败'
    }
  } finally {
    loading.value = false
  }
}

const fetchUserInfo = async () => {
  const accessToken = tokenResult.value?.access_token
  if (!accessToken) {
    Message.warning('请先获取 Access Token')
    return
  }
  try {
    const { data } = await rawHttp.get('/oauth2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    userInfoResult.value = data
  } catch {
    Message.error('获取用户信息失败')
  }
}

onMounted(() => {
  if (code.value && clientConfig.clientSecret) {
    exchangeToken()
  }
})
</script>

<template>
  <div class="callback-page">
    <div class="callback-card">
      <h2 class="callback-title">OAuth2 Callback 示例</h2>
      <p class="callback-subtitle">此页面模拟第三方应用接收授权回调并换取令牌（client_secret 仅供调试，生产环境应在后端服务完成换码）</p>

      <!-- 错误回调 -->
      <template v-if="errorParam">
        <a-alert type="error" style="margin-bottom: 16px">
          <template #title>授权失败</template>
          <div>错误码：{{ errorParam }}</div>
          <div v-if="errorDesc">描述：{{ errorDesc }}</div>
        </a-alert>
      </template>

      <!-- 回调参数 -->
      <a-descriptions :column="1" bordered size="small" style="margin-bottom: 20px" title="回调参数">
        <a-descriptions-item label="code">
          <a-typography-text :copyable="!!code">{{ code || '-' }}</a-typography-text>
        </a-descriptions-item>
        <a-descriptions-item label="state">{{ state || '-' }}</a-descriptions-item>
      </a-descriptions>

      <!-- 客户端凭据 -->
      <div class="callback-section-title">客户端凭据</div>
      <a-form :model="clientConfig" layout="vertical" size="small" style="margin-bottom: 20px">
        <a-form-item label="Client ID">
          <a-input v-model="clientConfig.clientId" placeholder="client_id" />
        </a-form-item>
        <a-form-item label="Client Secret">
          <a-input-password v-model="clientConfig.clientSecret" placeholder="创建密钥时获得的明文值" />
        </a-form-item>
        <a-form-item label="Redirect URI">
          <a-input v-model="clientConfig.redirectUri" placeholder="redirect_uri" />
        </a-form-item>
        <a-button type="primary" :loading="loading" :disabled="!code" @click="exchangeToken">换取 Token</a-button>
      </a-form>

      <!-- 换码结果 -->
      <template v-if="loading">
        <a-spin tip="正在换取令牌..." style="width: 100%; margin: 16px 0" />
      </template>

      <template v-else-if="tokenError">
        <a-alert type="error" style="margin-bottom: 16px">
          {{ tokenError }}
        </a-alert>
      </template>

      <template v-else-if="tokenResult">
        <a-descriptions :column="1" bordered size="small" style="margin-bottom: 20px" title="Token 响应">
          <a-descriptions-item label="access_token">
            <a-typography-paragraph :copyable="{ text: tokenResult.access_token }" style="margin: 0; word-break: break-all;">
              {{ tokenResult.access_token }}
            </a-typography-paragraph>
          </a-descriptions-item>
          <a-descriptions-item label="refresh_token">
            <a-typography-paragraph v-if="tokenResult.refresh_token" :copyable="{ text: tokenResult.refresh_token }" style="margin: 0; word-break: break-all;">
              {{ tokenResult.refresh_token }}
            </a-typography-paragraph>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="token_type">{{ tokenResult.token_type }}</a-descriptions-item>
          <a-descriptions-item label="expires_in">{{ tokenResult.expires_in }} 秒</a-descriptions-item>
          <a-descriptions-item label="scope">{{ tokenResult.scope }}</a-descriptions-item>
        </a-descriptions>

        <a-button type="primary" style="margin-bottom: 16px" @click="fetchUserInfo">调用 /oauth2/userinfo</a-button>

        <a-descriptions v-if="userInfoResult" :column="1" bordered size="small" title="UserInfo 响应">
          <a-descriptions-item v-for="(val, key) in userInfoResult" :key="key" :label="String(key)">
            {{ val || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </template>

      <template v-else-if="!code && !errorParam">
        <a-empty description="等待 OAuth2 授权回调..." />
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-1);
  padding: 16px;
}

.callback-card {
  width: 100%;
  max-width: 600px;
  background: var(--color-bg-2);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.callback-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 4px;
}

.callback-subtitle {
  font-size: 13px;
  color: var(--color-text-3);
  margin: 0 0 24px;
}

.callback-section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  margin-bottom: 12px;
}
</style>
