<template>
  <div class="mfa-verify">
    <div class="mfa-verify__header">
      <h3 class="title">多因素认证</h3>
      <p class="desc">请输入身份验证器应用中的 6 位验证码</p>
    </div>

    <div v-if="!useRecovery" class="mfa-verify__input">
      <a-input
        ref="codeInputRef"
        v-model="code"
        placeholder="请输入 6 位验证码"
        :max-length="6"
        size="large"
        allow-clear
        @press-enter="handleVerify"
      />
      <a-button
        type="primary"
        size="large"
        long
        :loading="loading"
        :disabled="code.length !== 6"
        class="mt-4"
        @click="handleVerify"
      >
        验证
      </a-button>
    </div>

    <div v-else class="mfa-verify__input">
      <a-input
        v-model="recoveryCode"
        placeholder="请输入恢复码"
        size="large"
        allow-clear
        @press-enter="handleRecoveryVerify"
      />
      <a-button
        type="primary"
        size="large"
        long
        :loading="loading"
        :disabled="!recoveryCode"
        class="mt-4"
        @click="handleRecoveryVerify"
      >
        验证
      </a-button>
    </div>

    <div class="mfa-verify__footer">
      <a-link @click="useRecovery = !useRecovery">
        {{ useRecovery ? '使用验证码' : '使用恢复码' }}
      </a-link>
      <a-link @click="$emit('back')">返回重新登录</a-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
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
const codeInputRef = ref()

const handleVerify = async () => {
  if (code.value.length !== 6) return
  loading.value = true
  try {
    const { data } = await mfaVerify(props.challengeToken, code.value, 'totp')
    emit('success', data)
  } catch {
    code.value = ''
    nextTick(() => codeInputRef.value?.focus())
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
  padding: 20px 0;

  &__header {
    margin-bottom: 24px;

    .title {
      font-size: 20px;
      font-weight: 500;
      color: var(--color-text-1);
      margin-bottom: 8px;
    }

    .desc {
      font-size: 14px;
      color: var(--color-text-3);
    }
  }

  &__input {
    .mt-4 {
      margin-top: 16px;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }
}
</style>
