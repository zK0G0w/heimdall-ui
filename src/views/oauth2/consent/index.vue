<script setup lang="ts">
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
const cardVisible = ref(false)

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
    cardVisible.value = true
    return
  }
  try {
    const { data } = await getConsentInfo(authReqId.value)
    if (!data.needConsent && data.redirectUrl) {
      window.location.href = data.redirectUrl
      return
    }
    consentData.value = data.consentData
  } catch {
    error.value = '授权请求已过期或无效，请返回应用重新发起'
  } finally {
    loading.value = false
    setTimeout(() => {
      cardVisible.value = true
    }, 50)
  }
}

const handleApprove = async () => {
  submitting.value = true
  try {
    const { data } = await approveConsent(authReqId.value)
    window.location.href = data.redirectUrl
  } catch {
    submitting.value = false
  }
}

const handleDeny = async () => {
  submitting.value = true
  try {
    const { data } = await denyConsent(authReqId.value)
    window.location.href = data.redirectUrl
  } catch {
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
  cardVisible.value = false
  fetchConsentInfo()
}

onMounted(() => {
  initTheme()
  fetchConsentInfo()
})
</script>

<template>
  <div class="consent-page">
    <!-- 背景纹理 -->
    <div class="consent-page__bg"></div>

    <!-- 主题切换按钮 -->
    <button class="consent-theme-toggle" :title="isDark ? '切换到亮色模式' : '切换到暗色模式'" @click="toggleTheme">
      <icon-sun-fill v-if="isDark" :size="18" />
      <icon-moon-fill v-else :size="18" />
    </button>

    <div class="consent-card" :class="{ 'consent-card--visible': cardVisible }">
      <!-- 加载中 -->
      <template v-if="loading">
        <div class="consent-loading">
          <div class="consent-loading__shield">
            <icon-lock :size="24" />
          </div>
          <p class="consent-loading__text">正在加载授权信息...</p>
        </div>
      </template>

      <!-- 错误状态 -->
      <template v-else-if="error">
        <div class="consent-error">
          <div class="consent-error__icon">
            <icon-exclamation-circle-fill :size="48" />
          </div>
          <p class="consent-error__msg">{{ error }}</p>
          <a-space>
            <a-button @click="handleRetry">重试</a-button>
            <a-button type="primary" @click="$router.push('/')">返回首页</a-button>
          </a-space>
        </div>
      </template>

      <!-- 正常展示 -->
      <template v-else-if="consentData">
        <!-- 安全标识 -->
        <div class="consent-security">
          <icon-safe :size="14" />
          <span>安全授权</span>
        </div>

        <!-- 应用信息 -->
        <div class="consent-app">
          <div class="consent-app__logo-wrapper">
            <img
              v-if="consentData.logo"
              :src="consentData.logo"
              :alt="consentData.appName"
              class="consent-app__logo"
            />
            <div v-else class="consent-app__logo-fallback">
              <span>{{ appInitial }}</span>
            </div>
          </div>
          <h2 class="consent-app__name">{{ consentData.appName }}</h2>
          <p class="consent-app__desc">正在请求访问你的账户信息</p>
        </div>

        <!-- 分隔线 -->
        <div class="consent-divider">
          <span>该应用将获得以下权限</span>
        </div>

        <!-- Scope 列表 -->
        <div class="consent-scopes">
          <div v-for="(scope, index) in consentData.scopes" :key="scope.code" class="consent-scopes__item" :style="{ animationDelay: `${index * 80}ms` }">
            <div class="consent-scopes__icon-wrapper">
              <icon-check-circle-fill class="consent-scopes__icon" />
            </div>
            <div class="consent-scopes__content">
              <span class="consent-scopes__name">{{ scope.name }}</span>
              <span class="consent-scopes__desc">{{ scope.description || scope.code }}</span>
            </div>
          </div>
        </div>

        <!-- 授权提示 -->
        <p class="consent-hint">授权后，该应用将在允许的范围内访问你的信息。你可以随时在账户设置中撤销授权。</p>

        <!-- 操作按钮 -->
        <div class="consent-actions">
          <a-button class="consent-actions__deny" :loading="submitting" :disabled="submitting" size="large" @click="handleDeny">
            拒绝
          </a-button>
          <a-button class="consent-actions__approve" type="primary" :loading="submitting" :disabled="submitting" size="large" @click="handleApprove">
            <icon-check style="margin-right: 4px" />
            同意授权
          </a-button>
        </div>

        <!-- 当前账号 -->
        <div class="consent-footer">
          <div class="consent-footer__user">
            <icon-user :size="14" />
            <span>{{ currentUser }}</span>
          </div>
          <a-link :hoverable="false" @click="handleSwitchAccount">切换账号</a-link>
        </div>
      </template>
    </div>

    <!-- 底部品牌标识 -->
    <div class="consent-brand">
      <img src="/logo.png" alt="Heimdall" class="consent-brand__logo" />
      <span class="consent-brand__text">Heimdall</span>
      <span class="consent-brand__divider"></span>
      <span class="consent-brand__slogan">统一认证中心</span>
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
  padding: 24px 16px;
  position: relative;
  overflow: hidden;
  background: var(--color-bg-1);

  &__bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 600px 400px at 15% 10%, rgba(var(--primary-6), 0.15) 0%, transparent 70%),
      radial-gradient(ellipse 500px 350px at 85% 90%, rgba(var(--primary-4), 0.12) 0%, transparent 70%),
      radial-gradient(ellipse 300px 300px at 50% 50%, rgba(var(--primary-6), 0.03) 0%, transparent 60%);
    pointer-events: none;
  }
}

.consent-theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
  color: var(--color-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;

  &:hover {
    border-color: rgb(var(--primary-6));
    color: rgb(var(--primary-6));
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(var(--primary-6), 0.15);
  }
}

.consent-card {
  width: 100%;
  max-width: 440px;
  background: var(--color-bg-2);
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 16px rgba(0, 0, 0, 0.06),
    0 12px 40px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
  border: 1px solid var(--color-border-1);
  opacity: 0;
  transform: translateY(12px) scale(0.98);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &--visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.consent-loading {
  text-align: center;
  padding: 40px 0;

  &__shield {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--color-fill-2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: var(--color-text-3);
    animation: pulse 1.5s ease-in-out infinite;
  }

  &__text {
    font-size: 14px;
    color: var(--color-text-3);
    margin: 0;
  }
}

.consent-security {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgb(var(--success-6));
  background: rgba(var(--success-6), 0.08);
  padding: 4px 10px;
  border-radius: 20px;
  margin-bottom: 24px;
  font-weight: 500;
}

.consent-app {
  text-align: center;
  margin-bottom: 20px;

  &__logo-wrapper {
    margin-bottom: 16px;
  }

  &__logo {
    width: 68px;
    height: 68px;
    border-radius: 16px;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 2px solid var(--color-border-1);
  }

  &__logo-fallback {
    width: 68px;
    height: 68px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgb(var(--primary-5)), rgb(var(--primary-7)));
    color: #fff;
    font-size: 28px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 4px 12px rgba(var(--primary-6), 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    letter-spacing: -0.5px;
  }

  &__name {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-1);
    margin: 0 0 6px;
    letter-spacing: -0.3px;
  }

  &__desc {
    font-size: 14px;
    color: var(--color-text-3);
    margin: 0;
  }
}

.consent-divider {
  display: flex;
  align-items: center;
  margin: 20px 0 16px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border-2);
  }

  span {
    padding: 0 12px;
    font-size: 12px;
    color: var(--color-text-4);
    white-space: nowrap;
  }
}

.consent-scopes {
  margin-bottom: 20px;

  &__item {
    display: flex;
    align-items: flex-start;
    padding: 12px 14px;
    border-radius: 10px;
    transition: background 0.2s;
    animation: fadeInUp 0.3s ease-out both;

    &:hover {
      background: var(--color-fill-1);
    }

    & + & {
      margin-top: 2px;
    }
  }

  &__icon-wrapper {
    margin-right: 12px;
    margin-top: 2px;
    flex-shrink: 0;
  }

  &__icon {
    color: rgb(var(--success-6));
    font-size: 18px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: 14px;
    color: var(--color-text-1);
    font-weight: 500;
    line-height: 1.4;
  }

  &__desc {
    font-size: 12px;
    color: var(--color-text-3);
    line-height: 1.4;
  }
}

.consent-hint {
  font-size: 12px;
  color: var(--color-text-4);
  text-align: center;
  margin: 0 0 24px;
  line-height: 1.6;
  padding: 0 8px;
}

.consent-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  &__deny,
  &__approve {
    flex: 1;
    border-radius: 10px !important;
    font-weight: 500;
  }

  &__approve {
    box-shadow: 0 2px 8px rgba(var(--primary-6), 0.3);
  }
}

.consent-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-1);

  &__user {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--color-text-3);
  }

  .arco-link {
    font-size: 13px;
  }
}

.consent-error {
  text-align: center;
  padding: 32px 0;

  &__icon {
    color: rgb(var(--warning-6));
    margin-bottom: 12px;
  }

  &__msg {
    font-size: 14px;
    color: var(--color-text-2);
    margin: 0 0 24px;
    line-height: 1.6;
  }
}

.consent-brand {
  margin-top: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1;

  &__logo {
    width: 22px;
    height: 22px;
    opacity: 0.6;
  }

  &__text {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-3);
    letter-spacing: -0.2px;
  }

  &__divider {
    width: 1px;
    height: 12px;
    background: var(--color-border-2);
  }

  &__slogan {
    font-size: 12px;
    color: var(--color-text-4);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.7; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 移动端适配
@media (max-width: 480px) {
  .consent-page {
    padding: 16px 12px;
  }

  .consent-theme-toggle {
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .consent-card {
    padding: 24px 16px;
    border-radius: 12px;
    max-width: 100%;
  }

  .consent-security {
    margin-bottom: 16px;
  }

  .consent-app {
    margin-bottom: 16px;

    &__logo,
    &__logo-fallback {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      font-size: 22px;
    }

    &__logo-wrapper {
      margin-bottom: 12px;
    }

    &__name {
      font-size: 18px;
    }

    &__desc {
      font-size: 13px;
    }
  }

  .consent-divider {
    margin: 16px 0 12px;
  }

  .consent-scopes {
    margin-bottom: 16px;

    &__item {
      padding: 10px 10px;
    }

    &__name {
      font-size: 13px;
    }

    &__desc {
      font-size: 11px;
    }
  }

  .consent-hint {
    margin-bottom: 20px;
    font-size: 11px;
  }

  .consent-actions {
    gap: 10px;
    margin-bottom: 16px;
  }

  .consent-footer {
    padding-top: 12px;
    flex-wrap: wrap;
    gap: 4px;

    &__user {
      font-size: 12px;
    }

    .arco-link {
      font-size: 12px;
    }
  }

  .consent-brand {
    margin-top: 24px;

    &__logo {
      width: 18px;
      height: 18px;
    }

    &__text {
      font-size: 12px;
    }

    &__slogan {
      font-size: 11px;
    }
  }
}
</style>
