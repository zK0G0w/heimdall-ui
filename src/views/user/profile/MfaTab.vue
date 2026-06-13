<template>
  <div class="mfa-tab">
    <a-spin :loading="loading">
      <div class="mfa-tab__status">
        <div class="status-row">
          <span class="label">MFA 状态</span>
          <a-tag v-if="status?.enabled" color="green">已开启</a-tag>
          <a-tag v-else color="gray">未开启</a-tag>
        </div>
        <div v-if="status?.enabled" class="status-row">
          <span class="label">验证方式</span>
          <span>TOTP（身份验证器应用）</span>
        </div>
        <div v-if="status?.enabled" class="status-row">
          <span class="label">剩余恢复码</span>
          <span :class="{ 'text-warning': (status?.remainingBackupCodes || 0) <= 2 }">
            {{ status?.remainingBackupCodes }} 个
          </span>
        </div>
        <div v-if="status?.forced" class="status-row">
          <a-tag color="orangered">管理员已要求开启</a-tag>
        </div>
      </div>

      <div class="mfa-tab__actions">
        <template v-if="!status?.enabled">
          <a-button type="primary" @click="setupModalVisible = true">
            立即开启
          </a-button>
        </template>
        <template v-else>
          <a-button
            status="danger"
            :disabled="status?.forced"
            @click="disableModalVisible = true"
          >
            关闭 MFA
          </a-button>
          <a-tooltip v-if="status?.forced" content="管理员已要求开启多因素认证，无法关闭">
            <icon-info-circle class="ml-1" />
          </a-tooltip>
          <a-button class="ml-3" @click="regenerateModalVisible = true">
            重新生成恢复码
          </a-button>
        </template>
      </div>
    </a-spin>

    <!-- 绑定弹窗 -->
    <MfaSetupModal v-model:visible="setupModalVisible" @success="onSetupSuccess" />

    <!-- 解绑确认 -->
    <a-modal
      v-model:visible="disableModalVisible"
      title="关闭多因素认证"
      @before-ok="handleDisable"
    >
      <p>关闭后账户安全性将降低，确认关闭请输入当前验证码：</p>
      <a-input v-model="disableCode" placeholder="请输入 6 位验证码" :max-length="6" />
    </a-modal>

    <!-- 重新生成恢复码确认 -->
    <a-modal
      v-model:visible="regenerateModalVisible"
      title="重新生成恢复码"
      @before-ok="handleRegenerate"
    >
      <p>旧的恢复码将全部失效，确认请输入当前验证码：</p>
      <a-input v-model="regenerateCode" placeholder="请输入 6 位验证码" :max-length="6" />
    </a-modal>

    <!-- 恢复码展示 -->
    <a-modal
      v-model:visible="codesModalVisible"
      title="恢复码"
      :footer="false"
      :mask-closable="false"
      width="auto"
    >
      <MfaRecoveryCodes :codes="newBackupCodes" />
      <a-button type="primary" long class="mt-4" @click="codesModalVisible = false">
        我已保存
      </a-button>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import MfaSetupModal from './MfaSetupModal.vue'
import MfaRecoveryCodes from '@/views/login/components/mfa/MfaRecoveryCodes.vue'
import { getMfaStatus, mfaDisable, mfaRegenerateBackupCodes } from '@/apis/auth/mfa'
import type { MfaStatusResp } from '@/apis/auth/type'

const loading = ref(false)
const status = ref<MfaStatusResp>()

const setupModalVisible = ref(false)
const disableModalVisible = ref(false)
const regenerateModalVisible = ref(false)
const codesModalVisible = ref(false)

const disableCode = ref('')
const regenerateCode = ref('')
const newBackupCodes = ref<string[]>([])

const fetchStatus = async () => {
  loading.value = true
  try {
    const { data } = await getMfaStatus()
    status.value = data
  } finally {
    loading.value = false
  }
}

const onSetupSuccess = () => {
  setupModalVisible.value = false
  fetchStatus()
}

const handleDisable = async (done: (closed: boolean) => void) => {
  if (disableCode.value.length !== 6) {
    Message.warning('请输入 6 位验证码')
    done(false)
    return
  }
  try {
    await mfaDisable(disableCode.value)
    Message.success('已关闭多因素认证')
    disableCode.value = ''
    done(true)
    fetchStatus()
  } catch {
    done(false)
  }
}

const handleRegenerate = async (done: (closed: boolean) => void) => {
  if (regenerateCode.value.length !== 6) {
    Message.warning('请输入 6 位验证码')
    done(false)
    return
  }
  try {
    const { data } = await mfaRegenerateBackupCodes(regenerateCode.value)
    newBackupCodes.value = data
    regenerateCode.value = ''
    done(true)
    codesModalVisible.value = true
    fetchStatus()
  } catch {
    done(false)
  }
}

onMounted(fetchStatus)
</script>

<style scoped lang="scss">
.mfa-tab {
  &__status {
    margin-bottom: 24px;

    .status-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--color-border-1);

      .label {
        width: 100px;
        color: var(--color-text-3);
        flex-shrink: 0;
      }
    }

    .text-warning {
      color: rgb(var(--orange-6));
    }
  }

  &__actions {
    display: flex;
    align-items: center;

    .ml-1 {
      margin-left: 4px;
      color: var(--color-text-3);
    }

    .ml-3 {
      margin-left: 12px;
    }
  }

  .mt-4 {
    margin-top: 16px;
  }
}
</style>
