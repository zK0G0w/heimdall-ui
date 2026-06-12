<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useRoute } from 'vue-router'
import { type Oauth2ConsentData, approveConsent, denyConsent, getConsentInfo } from '@/apis/oauth2/consent'
import { useAppStore, useUserStore } from '@/stores'

defineOptions({ name: 'Oauth2Authorize' })

const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const consentData = ref<Oauth2ConsentData>()
const isDark = ref(false)

const authReqId = computed(() => (route.query.auth_req_id as string) || '')

const currentUser = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '')

const appInitial = computed(() => {
  const name = consentData.value?.appName || ''
  return name.charAt(0)
})

const applyTheme = () => {
  if (isDark.value) {
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    document.body.removeAttribute('arco-theme')
  }
}

const initTheme = () => {
  if (appStore.theme) {
    isDark.value = appStore.theme === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme()
  appStore.toggleTheme(isDark.value)
}

const fetchConsentInfo = async () => {
  if (!authReqId.value) {
    error.value = '参数错误，请返回应用重新发起授权'
    loading.value = false
    return
  }
  try {
    const { data } = await getConsentInfo(authReqId.value)
    if (!data.needConsent && data.redirectUrl) {
      window.location.href = data.redirectUrl
      return
    }
    consentData.value = data.consentData
  } catch (e: any) {
    if (e?.response?.status === 400) {
      error.value = '授权请求已过期，请返回应用重新发起'
    } else {
      error.value = '加载失败，请重试'
    }
  } finally {
    loading.value = false
  }
}

const handleApprove = async () => {
  submitting.value = true
  try {
    const { data } = await approveConsent(authReqId.value)
    window.location.href = data.redirectUrl
  } catch {
    Message.error('授权操作失败，请重试')
    submitting.value = false
  }
}

const handleDeny = async () => {
  submitting.value = true
  try {
    const { data } = await denyConsent(authReqId.value)
    window.location.href = data.redirectUrl
  } catch {
    Message.error('操作失败，请重试')
    submitting.value = false
  }
}

const handleSwitchAccount = () => {
  const redirect = route.fullPath
  window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`
}

const handleRetry = () => {
  error.value = ''
  loading.value = true
  fetchConsentInfo()
}

onMounted(() => {
  initTheme()
  fetchConsentInfo()
})
</script>

<template>
  <div class="consent-page">
    <!-- 主题切换按钮 -->
    <button class="consent-theme-toggle" :title="isDark ? '切换到亮色模式' : '切换到暗色模式'" @click="toggleTheme">
      <icon-sun-fill v-if="isDark" :size="18" />
      <icon-moon-fill v-else :size="18" />
    </button>

    <div class="consent-card">
      <!-- 卡片顶部装饰线 -->
      <div class="consent-card__accent"></div>

      <!-- 加载中 -->
      <template v-if="loading">
        <a-space direction="vertical" fill :size="16" style="width: 100%">
          <a-skeleton :animation="true">
            <a-skeleton-shape shape="circle" style="width: 56px; height: 56px; margin: 0 auto; display: block;" />
          </a-skeleton>
          <a-skeleton :animation="true">
            <a-skeleton-line :rows="4" />
          </a-skeleton>
        </a-space>
      </template>

      <!-- 错误状态 -->
      <template v-else-if="error">
        <div class="consent-error">
          <icon-exclamation-circle-fill :size="48" style="color: rgb(var(--warning-6));" />
          <p class="consent-error__msg">{{ error }}</p>
          <a-space>
            <a-button @click="handleRetry">重试</a-button>
            <a-button type="primary" @click="$router.push('/')">返回首页</a-button>
          </a-space>
        </div>
      </template>

      <!-- 正常展示 -->
      <template v-else-if="consentData">
        <!-- 应用信息 -->
        <div class="consent-app">
          <img
            v-if="consentData.logo"
            :src="consentData.logo"
            :alt="consentData.appName"
            class="consent-app__logo"
          />
          <div v-else class="consent-app__logo-fallback">{{ appInitial }}</div>
          <h2 class="consent-app__name">{{ consentData.appName }}</h2>
          <p class="consent-app__desc">请求获取你的以下权限</p>
        </div>

        <!-- Scope 列表 -->
        <div class="consent-scopes">
          <div v-for="scope in consentData.scopes" :key="scope.code" class="consent-scopes__item">
            <icon-check-circle-fill class="consent-scopes__icon" />
            <div class="consent-scopes__text">
              <span class="consent-scopes__name">{{ scope.name }}</span>
              <span class="consent-scopes__code">{{ scope.code }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="consent-actions">
          <a-button :loading="submitting" :disabled="submitting" size="large" @click="handleDeny">拒绝</a-button>
          <a-button type="primary" :loading="submitting" :disabled="submitting" size="large" @click="handleApprove">同意授权</a-button>
        </div>

        <!-- 当前账号 -->
        <div class="consent-footer">
          <span>当前登录：{{ currentUser }}</span>
          <a-link @click="handleSwitchAccount">切换账号</a-link>
        </div>
      </template>
    </div>

    <!-- 底部品牌标识 -->
    <div class="consent-brand">
      <img src="/logo.svg" alt="Heimdall" class="consent-brand__logo" />
      <span class="consent-brand__text">Heimdall 统一认证中心</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.consent-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-1);
  padding: 16px;
  position: relative;
}

.consent-theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
  color: var(--color-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgb(var(--primary-6));
    color: rgb(var(--primary-6));
  }
}

.consent-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-2);
  border-radius: 12px;
  padding: 40px 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;

  &__accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, rgb(var(--primary-6)), rgb(var(--primary-4)));
  }

  @media (max-width: 480px) {
    padding: 32px 16px;
    border-radius: 8px;
  }
}

.consent-app {
  text-align: center;
  margin-bottom: 24px;

  &__logo {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    object-fit: cover;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &__logo-fallback {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    background: rgb(var(--primary-6));
    color: #fff;
    font-size: 26px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    box-shadow: 0 2px 8px rgba(var(--primary-6), 0.3);
  }

  &__name {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-1);
    margin: 0 0 6px;
  }

  &__desc {
    font-size: 14px;
    color: var(--color-text-3);
    margin: 0;
  }
}

.consent-scopes {
  background: var(--color-fill-1);
  border-radius: 8px;
  padding: 8px 16px;
  margin-bottom: 28px;

  &__item {
    display: flex;
    align-items: center;
    padding: 12px 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--color-border);
    }
  }

  &__icon {
    color: rgb(var(--success-6));
    font-size: 18px;
    margin-right: 12px;
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  &__name {
    font-size: 14px;
    color: var(--color-text-1);
    font-weight: 500;
  }

  &__code {
    font-size: 12px;
    color: var(--color-text-4);
    font-family: monospace;
  }
}

.consent-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .arco-btn {
    flex: 1;
  }
}

.consent-footer {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-3);

  .arco-link {
    margin-left: 8px;
    font-size: 13px;
  }
}

.consent-error {
  text-align: center;
  padding: 20px 0;

  &__msg {
    font-size: 14px;
    color: var(--color-text-2);
    margin: 16px 0 24px;
  }
}

.consent-brand {
  margin-top: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.5;

  &__logo {
    width: 20px;
    height: 20px;
  }

  &__text {
    font-size: 12px;
    color: var(--color-text-3);
  }
}
</style>
