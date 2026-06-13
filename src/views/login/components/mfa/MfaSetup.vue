<template>
  <div class="mfa-setup">
    <div class="mfa-setup__header">
      <h3 class="title">绑定多因素认证</h3>
      <p class="desc">使用验证器应用扫描二维码，请在 5 分钟内完成绑定</p>
    </div>

    <div class="mfa-setup__steps">
      <div class="step-item" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
        <div class="step-dot">{{ currentStep > 1 ? '✓' : '1' }}</div>
        <span class="step-label">扫码验证</span>
      </div>
      <div class="step-line" :class="{ active: currentStep > 1 }" />
      <div class="step-item" :class="{ active: currentStep >= 2 }">
        <div class="step-dot">2</div>
        <span class="step-label">保存恢复码</span>
      </div>
    </div>

    <!-- Step 1: 扫码 + 验证 -->
    <div v-if="currentStep === 1" class="mfa-setup__content">
      <div class="qr-card">
        <a-spin :loading="initLoading">
          <div class="qr-wrapper">
            <img v-if="qrcodeDataUrl" :src="qrcodeDataUrl" alt="TOTP QR Code" class="qr-image" />
            <div v-else class="qr-placeholder" />
          </div>
        </a-spin>
        <div class="qr-hint">
          <icon-scan :size="14" />
          <span>使用 Google Authenticator 或类似应用扫描</span>
        </div>
      </div>

      <div class="secret-section">
        <div class="secret-label">无法扫码？手动输入密钥</div>
        <div class="secret-box">
          <code class="secret-value">{{ setupData?.secret || '...' }}</code>
          <a-button size="mini" type="text" class="copy-btn" @click="handleCopySecret">
            <icon-copy :size="14" />
          </a-button>
        </div>
      </div>

      <div class="verify-section">
        <div class="verify-label">输入验证器中显示的动态码</div>
        <MfaCodeInput
          ref="verifyInputRef"
          v-model="verifyCode"
          :disabled="confirmLoading"
          @complete="handleConfirm"
        />
        <a-button
          type="primary"
          size="large"
          long
          :loading="confirmLoading"
          :disabled="verifyCode.length !== 6"
          class="confirm-btn"
          @click="handleConfirm"
        >
          确认绑定
        </a-button>
      </div>

      <div v-if="mode === 'login'" class="back-link">
        <a-link @click="$emit('cancel')">
          <icon-arrow-left :size="14" />
          返回重新登录
        </a-link>
      </div>
    </div>

    <!-- Step 2: 恢复码 -->
    <div v-if="currentStep === 2" class="mfa-setup__content">
      <MfaRecoveryCodes :codes="backupCodes" />
      <a-button type="primary" size="large" long class="confirm-btn" @click="handleComplete">
        我已保存，完成
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useClipboard } from '@vueuse/core'
import QRCode from 'qrcode'
import MfaCodeInput from './MfaCodeInput.vue'
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

const { copy } = useClipboard()

const currentStep = ref(1)
const initLoading = ref(false)
const confirmLoading = ref(false)
const setupData = ref<MfaSetupResp>()
const qrcodeDataUrl = ref('')
const verifyCode = ref('')
const backupCodes = ref<string[]>([])
const verifyInputRef = ref<InstanceType<typeof MfaCodeInput>>()

const initSetup = async () => {
  initLoading.value = true
  try {
    const { data } = await mfaSetupInit(props.challengeToken)
    setupData.value = data
    qrcodeDataUrl.value = await QRCode.toDataURL(data.qrcodeUri, { width: 220, margin: 2 })
    nextTick(() => verifyInputRef.value?.focus())
  } finally {
    initLoading.value = false
  }
}

const handleCopySecret = async () => {
  if (setupData.value?.secret) {
    await copy(setupData.value.secret)
    Message.success('已复制密钥')
  }
}

const handleConfirm = async () => {
  if (verifyCode.value.length !== 6) return
  confirmLoading.value = true
  try {
    const { data } = await mfaSetupConfirm(verifyCode.value, props.challengeToken)
    backupCodes.value = data
    currentStep.value = 2
  } catch {
    verifyInputRef.value?.shake()
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
  padding: 16px 0;

  &__header {
    text-align: center;
    margin-bottom: 20px;

    .title {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-1);
      margin-bottom: 6px;
    }

    .desc {
      font-size: 13px;
      color: var(--color-text-3);
    }
  }

  &__steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    margin-bottom: 24px;
    padding: 0 40px;

    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .step-dot {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid var(--color-border-2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: var(--color-text-3);
        transition: all 0.3s ease;
      }

      .step-label {
        font-size: 12px;
        color: var(--color-text-3);
        transition: color 0.3s ease;
      }

      &.active .step-dot {
        border-color: rgb(var(--primary-6));
        background: rgb(var(--primary-6));
        color: #fff;
      }

      &.active .step-label {
        color: var(--color-text-1);
      }

      &.done .step-dot {
        border-color: rgb(var(--success-6));
        background: rgb(var(--success-6));
        color: #fff;
      }
    }

    .step-line {
      flex: 1;
      height: 2px;
      background: var(--color-border-2);
      margin: 0 12px;
      margin-bottom: 22px;
      transition: background 0.3s ease;

      &.active {
        background: rgb(var(--success-6));
      }
    }
  }

  &__content {
    .qr-card {
      background: var(--color-fill-1);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      text-align: center;

      .qr-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 12px;
      }

      .qr-image {
        width: 180px;
        height: 180px;
        border-radius: 8px;
        border: 1px solid var(--color-border-1);
      }

      .qr-placeholder {
        width: 180px;
        height: 180px;
        border-radius: 8px;
        background: var(--color-fill-2);
      }

      .qr-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 12px;
        color: var(--color-text-3);
      }
    }

    .secret-section {
      margin-bottom: 20px;

      .secret-label {
        font-size: 12px;
        color: var(--color-text-3);
        margin-bottom: 6px;
      }

      .secret-box {
        display: flex;
        align-items: center;
        background: var(--color-fill-2);
        border-radius: 6px;
        padding: 8px 12px;
        gap: 8px;

        .secret-value {
          flex: 1;
          font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--color-text-2);
          word-break: break-all;
        }

        .copy-btn {
          flex-shrink: 0;
          color: var(--color-text-3);

          &:hover {
            color: rgb(var(--primary-6));
          }
        }
      }
    }

    .verify-section {
      .verify-label {
        font-size: 13px;
        color: var(--color-text-2);
        margin-bottom: 12px;
        text-align: center;
      }
    }

    .confirm-btn {
      margin-top: 20px;
      height: 42px;
      border-radius: 8px;
      font-weight: 500;
    }

    .back-link {
      margin-top: 16px;
      text-align: center;

      .arco-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
      }
    }
  }
}
</style>
