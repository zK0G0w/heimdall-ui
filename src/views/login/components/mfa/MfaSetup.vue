<template>
  <div class="mfa-setup">
    <div class="mfa-setup__header">
      <h3 class="title">绑定多因素认证</h3>
      <p class="desc">使用身份验证器应用（如 Google Authenticator）扫描下方二维码</p>
    </div>

    <a-steps :current="currentStep" class="mfa-setup__steps">
      <a-step title="扫描二维码" />
      <a-step title="验证" />
      <a-step title="保存恢复码" />
    </a-steps>

    <!-- Step 1: 扫码 -->
    <div v-if="currentStep === 1" class="mfa-setup__content">
      <a-spin :loading="initLoading" class="qr-spin">
        <div class="qr-wrapper">
          <img v-if="qrcodeDataUrl" :src="qrcodeDataUrl" alt="TOTP QR Code" class="qr-image" />
        </div>
      </a-spin>
      <div class="secret-display">
        <span class="label">手动输入密钥：</span>
        <a-typography-paragraph copyable class="secret-text">
          {{ setupData?.secret || '' }}
        </a-typography-paragraph>
      </div>
      <a-button type="primary" size="large" long @click="currentStep = 2">
        下一步
      </a-button>
    </div>

    <!-- Step 2: 验证 -->
    <div v-if="currentStep === 2" class="mfa-setup__content">
      <p class="verify-hint">请输入身份验证器应用中显示的 6 位验证码</p>
      <a-input
        ref="verifyInputRef"
        v-model="verifyCode"
        placeholder="请输入 6 位验证码"
        :max-length="6"
        size="large"
        allow-clear
        @press-enter="handleConfirm"
      />
      <a-button
        type="primary"
        size="large"
        long
        :loading="confirmLoading"
        :disabled="verifyCode.length !== 6"
        class="mt-4"
        @click="handleConfirm"
      >
        确认绑定
      </a-button>
      <a-button size="large" long class="mt-2" @click="currentStep = 1">
        上一步
      </a-button>
    </div>

    <!-- Step 3: 恢复码 -->
    <div v-if="currentStep === 3" class="mfa-setup__content">
      <MfaRecoveryCodes :codes="backupCodes" />
      <a-button type="primary" size="large" long class="mt-4" @click="handleComplete">
        我已保存，完成
      </a-button>
    </div>

    <div v-if="mode === 'login' && currentStep === 1" class="mfa-setup__footer">
      <a-link @click="$emit('cancel')">返回重新登录</a-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import QRCode from 'qrcode'
import MfaRecoveryCodes from './MfaRecoveryCodes.vue'
import { mfaSetupConfirm, mfaSetupInit, mfaVerify } from '@/apis/auth/mfa'
import type { LoginResp, MfaSetupResp } from '@/apis/auth/type'

const props = withDefaults(defineProps<{
  challengeToken?: string
  mode?: 'login' | 'profile'
}>(), {
  mode: 'login',
})

const emit = defineEmits<{
  success: [resp?: LoginResp]
  cancel: []
}>()

const currentStep = ref(1)
const initLoading = ref(false)
const confirmLoading = ref(false)
const setupData = ref<MfaSetupResp>()
const qrcodeDataUrl = ref('')
const verifyCode = ref('')
const backupCodes = ref<string[]>([])
const verifyInputRef = ref()

const initSetup = async () => {
  initLoading.value = true
  try {
    const { data } = await mfaSetupInit(props.challengeToken)
    setupData.value = data
    qrcodeDataUrl.value = await QRCode.toDataURL(data.qrcodeUri, { width: 200, margin: 2 })
  } finally {
    initLoading.value = false
  }
}

const handleConfirm = async () => {
  if (verifyCode.value.length !== 6) return
  confirmLoading.value = true
  try {
    const { data } = await mfaSetupConfirm(verifyCode.value, props.challengeToken)
    backupCodes.value = data
    currentStep.value = 3
  } catch {
    verifyCode.value = ''
    nextTick(() => verifyInputRef.value?.focus())
  } finally {
    confirmLoading.value = false
  }
}

const handleComplete = async () => {
  if (props.mode === 'login' && props.challengeToken) {
    try {
      const { data } = await mfaVerify(props.challengeToken, verifyCode.value, 'totp')
      emit('success', data)
    } catch {
      emit('cancel')
    }
  } else {
    emit('success')
  }
}

onMounted(initSetup)
</script>

<style scoped lang="scss">
.mfa-setup {
  padding: 20px 0;

  &__header {
    margin-bottom: 16px;

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

  &__steps {
    margin-bottom: 24px;
  }

  &__content {
    .qr-spin {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }

    .qr-wrapper {
      display: flex;
      justify-content: center;
    }

    .qr-image {
      width: 200px;
      height: 200px;
      border: 1px solid var(--color-border-2);
      border-radius: 8px;
    }

    .secret-display {
      margin-bottom: 16px;
      text-align: center;

      .label {
        font-size: 12px;
        color: var(--color-text-3);
      }

      .secret-text {
        margin: 4px 0 0;
        font-family: monospace;
        font-size: 12px;
      }
    }

    .verify-hint {
      margin-bottom: 12px;
      color: var(--color-text-2);
    }

    .mt-4 {
      margin-top: 16px;
    }

    .mt-2 {
      margin-top: 8px;
    }
  }

  &__footer {
    margin-top: 16px;
    text-align: center;
  }
}
</style>
