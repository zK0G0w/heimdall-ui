<script setup lang="ts">
import { useRoute } from 'vue-router'
import { type Oauth2ConsentInfoResp, getConsentInfo, submitConsentDecision } from '@/apis/oauth2/consent'
import { useUserStore } from '@/stores'

defineOptions({ name: 'Oauth2Consent' })

const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const consentInfo = ref<Oauth2ConsentInfoResp>()

const authReqId = computed(() => (route.query.auth_req_id as string) || '')

const currentUser = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '')

const appInitial = computed(() => {
  const name = consentInfo.value?.appName || ''
  return name.charAt(0)
})

const fetchConsentInfo = async () => {
  if (!authReqId.value) {
    error.value = '参数错误，请返回应用重新发起授权'
    loading.value = false
    return
  }
  try {
    const { data } = await getConsentInfo(authReqId.value)
    consentInfo.value = data
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

const handleApprove = () => {
  submitting.value = true
  submitConsentDecision('approve', authReqId.value)
}

const handleDeny = () => {
  submitting.value = true
  submitConsentDecision('deny', authReqId.value)
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
  fetchConsentInfo()
})
</script>

<template>
  <div class="consent-page">
    <div class="consent-card">
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
      <template v-else-if="consentInfo">
        <!-- 应用信息 -->
        <div class="consent-app">
          <img
            v-if="consentInfo.logo"
            :src="consentInfo.logo"
            :alt="consentInfo.appName"
            class="consent-app__logo"
          />
          <div v-else class="consent-app__logo-fallback">{{ appInitial }}</div>
          <h2 class="consent-app__name">{{ consentInfo.appName }}</h2>
          <p class="consent-app__desc">请求获取你的以下权限</p>
        </div>

        <!-- Scope 列表 -->
        <div class="consent-scopes">
          <div v-for="scope in consentInfo.scopes" :key="scope.code" class="consent-scopes__item">
            <span class="consent-scopes__dot"></span>
            <div class="consent-scopes__text">
              <span class="consent-scopes__name">{{ scope.name }}</span>
              <span class="consent-scopes__code">{{ scope.code }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="consent-actions">
          <a-button :loading="submitting" :disabled="submitting" @click="handleDeny">拒绝</a-button>
          <a-button type="primary" :loading="submitting" :disabled="submitting" @click="handleApprove">同意授权</a-button>
        </div>

        <!-- 当前账号 -->
        <div class="consent-footer">
          <span>当前登录：{{ currentUser }}</span>
          <a-link @click="handleSwitchAccount">切换账号</a-link>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.consent-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-1);
  padding: 16px;
}

.consent-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-2);
  border-radius: 12px;
  padding: 40px 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  @media (max-width: 480px) {
    padding: 32px 16px;
    border-radius: 8px;
  }
}

.consent-app {
  text-align: center;
  margin-bottom: 24px;

  &__logo {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    object-fit: cover;
    margin-bottom: 12px;
  }

  &__logo-fallback {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: rgb(var(--primary-6));
    color: #fff;
    font-size: 24px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
  }

  &__name {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-1);
    margin: 0 0 4px;
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
  padding: 12px 16px;
  margin-bottom: 24px;

  &__item {
    display: flex;
    align-items: center;
    padding: 10px 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--color-border);
    }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgb(var(--primary-6));
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
  }

  &__code {
    font-size: 12px;
    color: var(--color-text-4);
  }
}

.consent-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .arco-btn {
    flex: 1;
    height: 40px;
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
</style>
