<template>
  <div class="mfa-verify">
    <div class="mfa-verify__icon">
      <div class="icon-ring">
        <icon-safe :size="36" />
      </div>
    </div>

    <div class="mfa-verify__header">
      <h3 class="title">身份验证</h3>
      <p class="desc">
        {{ useRecovery ? '请输入一组恢复码完成验证' : '请输入验证器应用中的 6 位动态码' }}
      </p>
    </div>

    <div v-if="!useRecovery" class="mfa-verify__body">
      <MfaCodeInput
        ref="codeInputRef"
        v-model="code"
        :disabled="loading"
        @complete="handleVerify"
      />
      <a-button
        type="primary"
        size="large"
        long
        :loading="loading"
        :disabled="code.length !== 6"
        class="verify-btn"
        @click="handleVerify"
      >
        验证
      </a-button>
    </div>

    <div v-else class="mfa-verify__body">
      <a-input
        ref="recoveryInputRef"
        v-model="recoveryCode"
        placeholder="例如：ABCD1234"
        size="large"
        allow-clear
        class="recovery-input"
        @press-enter="handleRecoveryVerify"
      />
      <a-button
        type="primary"
        size="large"
        long
        :loading="loading"
        :disabled="!recoveryCode"
        class="verify-btn"
        @click="handleRecoveryVerify"
      >
        验证
      </a-button>
    </div>

    <a-divider class="divider" />

    <div class="mfa-verify__footer">
      <a-link class="link" @click="useRecovery = !useRecovery">
        <icon-swap v-if="!useRecovery" :size="14" />
        <icon-code v-else :size="14" />
        {{ useRecovery ? '使用动态码' : '使用恢复码' }}
      </a-link>
      <a-link class="link" @click="$emit('back')">
        <icon-arrow-left :size="14" />
        返回登录
      </a-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import MfaCodeInput from './MfaCodeInput.vue'
import { mfaVerify } from '@/apis/auth/mfa'
import type { LoginResp } from '@/apis/auth/type'

const props = defineProps<{
  challengeToken: string
}>()

const emit = defineEmits<{
  success: [resp: LoginResp]
  back: []
}>()

const code = ref('')
const recoveryCode = ref('')
const useRecovery = ref(false)
const loading = ref(false)
const codeInputRef = ref<InstanceType<typeof MfaCodeInput>>()
const recoveryInputRef = ref()

const handleVerify = async () => {
  if (code.value.length !== 6) return
  loading.value = true
  try {
    const { data } = await mfaVerify(props.challengeToken, code.value, 'totp')
    emit('success', data)
  } catch {
    codeInputRef.value?.shake()
  } finally {
    loading.value = false
  }
}

const handleRecoveryVerify = async () => {
  if (!recoveryCode.value) return
  loading.value = true
  try {
    const { data } = await mfaVerify(props.challengeToken, recoveryCode.value, 'recovery')
    emit('success', data)
  } catch {
    recoveryCode.value = ''
    nextTick(() => recoveryInputRef.value?.focus())
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  nextTick(() => codeInputRef.value?.focus())
})
</script>

<style scoped lang="scss">
.mfa-verify {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__icon {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;

    .icon-ring {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(var(--primary-1), 0.8), rgba(var(--primary-2), 0.6));
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgb(var(--primary-6));
      box-shadow: 0 4px 16px rgba(var(--primary-6), 0.15);
    }
  }

  &__header {
    text-align: center;
    margin-bottom: 28px;

    .title {
      font-size: 22px;
      font-weight: 600;
      color: var(--color-text-1);
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .desc {
      font-size: 14px;
      color: var(--color-text-3);
      line-height: 1.5;
    }
  }

  &__body {
    width: 100%;

    .verify-btn {
      margin-top: 24px;
      height: 42px;
      border-radius: 8px;
      font-weight: 500;
    }

    .recovery-input {
      :deep(.arco-input) {
        text-align: center;
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 16px;
        letter-spacing: 2px;
      }
    }
  }

  .divider {
    margin: 24px 0 16px;
  }

  &__footer {
    width: 100%;
    display: flex;
    justify-content: space-between;

    .link {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }
  }
}
</style>
