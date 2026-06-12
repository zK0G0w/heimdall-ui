<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useRoute } from 'vue-router'
import http from '@/utils/http'

defineOptions({ name: 'Oauth2Callback' })

const route = useRoute()

const CLIENT_ID = 'acb0588ffbb34b96b50d7f767d499779'
const CLIENT_SECRET = '9a5e2fcdd64348e5a1b3c768b8f24012'
const REDIRECT_URI = 'http://localhost:5173/oauth2/callback'

const code = computed(() => (route.query.code as string) || '')
const state = computed(() => (route.query.state as string) || '')
const errorParam = computed(() => (route.query.error as string) || '')
const errorDesc = computed(() => (route.query.error_description as string) || '')

const loading = ref(false)
const tokenResult = ref<any>(null)
const userInfoResult = ref<any>(null)
const tokenError = ref('')

const exchangeToken = async () => {
  if (!code.value) return
  loading.value = true
  tokenError.value = ''
  try {
    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('code', code.value)
    params.append('client_id', CLIENT_ID)
    params.append('client_secret', CLIENT_SECRET)
    params.append('redirect_uri', REDIRECT_URI)

    const { data } = await http.post<any>('/oauth2/token', params)
    tokenResult.value = data
  } catch (e: any) {
    tokenError.value = e?.response?.data?.error_description || e?.message || '换码失败'
  } finally {
    loading.value = false
  }
}

const fetchUserInfo = async () => {
  if (!tokenResult.value?.accessToken) {
    Message.warning('请先获取 Access Token')
    return
  }
  try {
    const { data } = await http.get<any>('/oauth2/userinfo', {}, {
      headers: { Authorization: `Bearer ${tokenResult.value.accessToken}` },
    })
    userInfoResult.value = data
  } catch {
    Message.error('获取用户信息失败')
  }
}

onMounted(() => {
  if (code.value) {
    exchangeToken()
  }
})
</script>

<template>
  <div class="callback-page">
    <div class="callback-card">
      <h2 class="callback-title">OAuth2 Callback 示例</h2>
      <p class="callback-subtitle">此页面模拟第三方应用接收授权回调并换取令牌</p>

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

      <!-- 换码结果 -->
      <template v-if="loading">
        <a-spin tip="正在换取令牌..." style="width: 100%; margin: 16px 0" />
      </template>

      <template v-else-if="tokenError">
        <a-alert type="error" style="margin-bottom: 16px">
          {{ tokenError }}
        </a-alert>
        <a-button @click="exchangeToken">重试换码</a-button>
      </template>

      <template v-else-if="tokenResult">
        <a-descriptions :column="1" bordered size="small" style="margin-bottom: 20px" title="Token 响应">
          <a-descriptions-item label="access_token">
            <a-typography-paragraph :copyable="{ text: tokenResult.accessToken }" style="margin: 0; word-break: break-all;">
              {{ tokenResult.accessToken }}
            </a-typography-paragraph>
          </a-descriptions-item>
          <a-descriptions-item label="refresh_token">
            <a-typography-paragraph v-if="tokenResult.refreshToken" :copyable="{ text: tokenResult.refreshToken }" style="margin: 0; word-break: break-all;">
              {{ tokenResult.refreshToken }}
            </a-typography-paragraph>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="token_type">{{ tokenResult.tokenType }}</a-descriptions-item>
          <a-descriptions-item label="expires_in">{{ tokenResult.expiresIn }} 秒</a-descriptions-item>
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
</style>
