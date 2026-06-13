<template>
  <a-card title="安全设置" bordered class="gradient-card">
    <div v-for="item in modeList" :key="item.title">
      <div class="item">
        <div class="icon-wrapper"><GiSvgIcon :name="item.icon" :size="26" /></div>
        <div class="info">
          <div class="info-top">
            <span class="label">{{ item.title }}</span>
            <span class="bind">
              <icon-check-circle-fill v-if="item.status" :size="14" class="success" />
              <icon-exclamation-circle-fill v-else :size="14" class="warning" />
              <span style="font-size: 12px" :class="item.status ? 'success' : 'warning'">{{ item.statusString }}</span>
            </span>
          </div>
          <div class="info-desc">
            <span class="value">{{ item.value }}</span>
            {{ item.subtitle }}
          </div>
        </div>
        <div class="btn-wrapper">
          <a-button
            v-if="item.jumpMode === 'modal'"
            class="btn"
            :type="item.status ? 'secondary' : 'primary'"
            @click="onUpdate(item.type, item.status)"
          >
            {{ ['password'].includes(item.type) || item.status ? '修改' : '绑定' }}
          </a-button>
        </div>
      </div>
    </div>

    <!-- MFA 多因素认证 -->
    <div class="item">
      <div class="icon-wrapper"><GiSvgIcon name="mfa" :size="26" /></div>
      <div class="info">
        <div class="info-top">
          <span class="label">多因素认证</span>
          <span class="bind">
            <icon-check-circle-fill v-if="mfaStatus?.enabled" :size="14" class="success" />
            <icon-exclamation-circle-fill v-else :size="14" class="warning" />
            <span style="font-size: 12px" :class="mfaStatus?.enabled ? 'success' : 'warning'">
              {{ mfaStatus?.enabled ? '已开启' : '未开启' }}
            </span>
          </span>
        </div>
        <div class="info-desc">
          {{ mfaStatus?.enabled ? `TOTP 验证器应用，剩余 ${mfaStatus.remainingBackupCodes} 个恢复码` : '开启后登录需输入验证器动态码，提升账户安全' }}
        </div>
      </div>
      <div class="btn-wrapper">
        <a-button
          v-if="!mfaStatus?.enabled"
          class="btn"
          type="primary"
          @click="setupModalVisible = true"
        >
          绑定
        </a-button>
        <a-button
          v-else
          class="btn"
          type="secondary"
          @click="mfaManageVisible = true"
        >
          管理
        </a-button>
      </div>
    </div>
  </a-card>

  <VerifyModel ref="verifyModelRef" />

  <!-- MFA 绑定弹窗 -->
  <MfaSetupModal v-model:visible="setupModalVisible" @success="onMfaSetupSuccess" />

  <!-- MFA 管理弹窗 -->
  <a-modal
    v-model:visible="mfaManageVisible"
    title="多因素认证管理"
    :footer="false"
    width="420px"
  >
    <div class="mfa-manage">
      <div class="mfa-manage__info">
        <div class="row">
          <span class="label">状态</span>
          <a-tag color="green">已开启</a-tag>
        </div>
        <div class="row">
          <span class="label">验证方式</span>
          <span>TOTP（验证器应用）</span>
        </div>
        <div class="row">
          <span class="label">剩余恢复码</span>
          <span :class="{ 'text-warning': (mfaStatus?.remainingBackupCodes || 0) <= 2 }">
            {{ mfaStatus?.remainingBackupCodes }} 个
          </span>
        </div>
        <div v-if="mfaStatus?.forced" class="row">
          <span class="label">策略</span>
          <a-tag color="orangered">管理员已要求开启</a-tag>
        </div>
      </div>
      <a-divider />
      <a-space direction="vertical" fill>
        <a-button long @click="regenerateModalVisible = true">
          重新生成恢复码
        </a-button>
        <a-button
          long
          status="danger"
          :disabled="mfaStatus?.forced"
          @click="disableModalVisible = true"
        >
          关闭多因素认证
        </a-button>
        <div v-if="mfaStatus?.forced" class="forced-hint">
          <icon-info-circle /> 管理员已要求开启，无法关闭
        </div>
      </a-space>
    </div>
  </a-modal>

  <!-- 解绑确认 -->
  <a-modal
    v-model:visible="disableModalVisible"
    title="关闭多因素认证"
    :unmount-on-close="true"
    @open="() => nextTick(() => disableCodeRef?.focus())"
    @before-ok="handleDisable"
  >
    <p style="margin-bottom: 12px">关闭后账户安全性将降低，确认关闭请输入当前验证码：</p>
    <MfaCodeInput ref="disableCodeRef" v-model="disableCode" />
  </a-modal>

  <!-- 重新生成恢复码确认 -->
  <a-modal
    v-model:visible="regenerateModalVisible"
    title="重新生成恢复码"
    :unmount-on-close="true"
    @open="() => nextTick(() => regenerateCodeRef?.focus())"
    @before-ok="handleRegenerate"
  >
    <p style="margin-bottom: 12px">旧的恢复码将全部失效，确认请输入当前验证码：</p>
    <MfaCodeInput ref="regenerateCodeRef" v-model="regenerateCode" />
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
    <a-button type="primary" long style="margin-top: 16px" @click="codesModalVisible = false">
      我已保存
    </a-button>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { ModeItem } from '../type'
import VerifyModel from '../components/VerifyModel.vue'
import MfaSetupModal from './MfaSetupModal.vue'
import MfaCodeInput from '@/views/login/components/mfa/MfaCodeInput.vue'
import MfaRecoveryCodes from '@/views/login/components/mfa/MfaRecoveryCodes.vue'
import { getMfaStatus, mfaDisable, mfaRegenerateBackupCodes } from '@/apis/auth/mfa'
import type { MfaStatusResp } from '@/apis/auth/type'
import { useUserStore } from '@/stores'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const modeList = ref<ModeItem[]>([])
modeList.value = [
  {
    title: '安全手机',
    icon: 'phone-color',
    value: userInfo.value.phone,
    subtitle: `${userInfo.value.phone ? '' : '手机号'}可用于登录、身份验证、密码找回、通知接收`,
    type: 'phone',
    jumpMode: 'modal',
    status: !!userInfo.value.phone,
    statusString: userInfo.value.phone ? '已绑定' : '未绑定',
  },
  {
    title: '安全邮箱',
    icon: 'email-color',
    value: userInfo.value.email,
    subtitle: `${userInfo.value.email ? '' : '邮箱'}可用于登录、身份验证、密码找回、通知接收`,
    type: 'email',
    jumpMode: 'modal',
    status: !!userInfo.value.email,
    statusString: userInfo.value.email ? '已绑定' : '未绑定',
  },
  {
    title: '登录密码',
    icon: 'password-color',
    subtitle: userInfo.value.pwdResetTime ? `为了您的账号安全，建议定期修改密码` : '请设置密码，可通过账号+密码登录',
    type: 'password',
    jumpMode: 'modal',
    status: !!userInfo.value.pwdResetTime,
    statusString: userInfo.value.pwdResetTime ? '已设置' : '未设置',
  },
]

const verifyModelRef = ref<InstanceType<typeof VerifyModel>>()
const onUpdate = (type: string) => {
  verifyModelRef.value?.open(type)
}

// MFA 相关
const mfaStatus = ref<MfaStatusResp>()
const setupModalVisible = ref(false)
const mfaManageVisible = ref(false)
const disableModalVisible = ref(false)
const regenerateModalVisible = ref(false)
const codesModalVisible = ref(false)
const disableCode = ref('')
const regenerateCode = ref('')
const newBackupCodes = ref<string[]>([])
const disableCodeRef = ref<InstanceType<typeof MfaCodeInput>>()
const regenerateCodeRef = ref<InstanceType<typeof MfaCodeInput>>()

const fetchMfaStatus = async () => {
  try {
    const { data } = await getMfaStatus()
    mfaStatus.value = data
  } catch {
    // 静默处理
  }
}

const onMfaSetupSuccess = () => {
  setupModalVisible.value = false
  fetchMfaStatus()
}

const handleDisable = async (done: (closed: boolean) => void) => {
  if (disableCode.value.length !== 6) {
    Message.warning('请输入 6 位验证码')
    done(false)
    return
  }
  try {
    await mfaDisable(disableCode.value)
    disableCode.value = ''
    mfaManageVisible.value = false
    done(true)
    Message.success('MFA 已关闭，请同时删除 Authenticator App 中对应的 Heimdall 条目')
    fetchMfaStatus()
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
    fetchMfaStatus()
  } catch {
    done(false)
  }
}

onMounted(fetchMfaStatus)
</script>

<style scoped lang="scss">
.mfa-manage {
  &__info {
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;

      .label {
        width: 80px;
        color: var(--color-text-3);
        flex-shrink: 0;
      }
    }

    .text-warning {
      color: rgb(var(--orange-6));
    }
  }

  .forced-hint {
    font-size: 12px;
    color: var(--color-text-3);
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
</style>
