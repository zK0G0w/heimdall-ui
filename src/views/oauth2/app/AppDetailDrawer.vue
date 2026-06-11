<template>
  <a-drawer v-model:visible="visible" title="应用详情" :width="width >= 680 ? 680 : '100%'" :footer="false">
    <a-tabs default-active-key="basic" @change="onTabChange">
      <!-- Tab 1: 基础信息 -->
      <a-tab-pane key="basic" title="基础信息">
        <a-descriptions :column="2" size="large" class="general-description">
          <a-descriptions-item label="应用名称">{{ dataDetail?.appName }}</a-descriptions-item>
          <a-descriptions-item label="应用类型">{{ dataDetail?.appType ? appTypeMap[dataDetail.appType] : '-' }}</a-descriptions-item>
          <a-descriptions-item label="Client ID" :span="2">
            <a-typography-paragraph :copyable="{ text: dataDetail?.clientId }" style="margin: 0">
              {{ dataDetail?.clientId }}
            </a-typography-paragraph>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag v-if="dataDetail?.status === 1" color="green">启用</a-tag>
            <a-tag v-else color="red">禁用</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="允许静默授权">{{ dataDetail?.allowSilentAuth ? '是' : '否' }}</a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">{{ dataDetail?.description || '-' }}</a-descriptions-item>
          <a-descriptions-item label="Access Token 有效期">{{ dataDetail?.accessTokenTtl }} 秒</a-descriptions-item>
          <a-descriptions-item label="Refresh Token 有效期">{{ dataDetail?.refreshTokenTtl }} 秒</a-descriptions-item>
          <a-descriptions-item label="允许的授权类型" :span="2">
            <a-space wrap>
              <a-tag v-for="grantType in grantTypeList" :key="grantType" color="arcoblue">{{ grantType }}</a-tag>
              <span v-if="!grantTypeList.length">-</span>
            </a-space>
          </a-descriptions-item>
          <a-descriptions-item label="创建人">{{ dataDetail?.createUserString }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
          <a-descriptions-item label="修改人">{{ dataDetail?.updateUserString }}</a-descriptions-item>
          <a-descriptions-item label="修改时间">{{ dataDetail?.updateTime }}</a-descriptions-item>
        </a-descriptions>
      </a-tab-pane>

      <!-- Tab 2: 密钥管理 -->
      <a-tab-pane key="secret" title="密钥管理">
        <div style="margin-bottom: 16px">
          <a-button v-permission="['oauth2:app:update']" type="primary" @click="onCreateSecret">
            <template #icon><icon-plus /></template>
            生成新密钥
          </a-button>
        </div>
        <a-table
          :data="secretList"
          :loading="secretLoading"
          :pagination="false"
          :bordered="{ cell: true }"
          size="small"
        >
          <template #columns>
            <a-table-column title="密钥值" data-index="clientSecret" ellipsis tooltip />
            <a-table-column title="状态" data-index="status" :width="80" align="center">
              <template #cell="{ record }">
                <a-tag v-if="record.status === 1" color="green">启用</a-tag>
                <a-tag v-else color="red">禁用</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="过期时间" data-index="expiresAt" :width="180" />
            <a-table-column title="创建时间" data-index="createTime" :width="180" />
            <a-table-column title="操作" :width="80" align="center">
              <template #cell="{ record }">
                <a-link v-permission="['oauth2:app:update']" status="danger" @click="onDeleteSecret(record)">删除</a-link>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </a-tab-pane>

      <!-- Tab 3: 回调地址 -->
      <a-tab-pane key="redirect" title="回调地址">
        <div v-for="(uri, index) in redirectUris" :key="index" style="display: flex; align-items: center; margin-bottom: 8px; gap: 8px">
          <a-input v-model="redirectUris[index]" placeholder="请输入回调地址" allow-clear />
          <a-button type="text" status="danger" @click="redirectUris.splice(index, 1)">
            <template #icon><icon-minus-circle /></template>
          </a-button>
        </div>
        <a-button style="margin-bottom: 16px" @click="redirectUris.push('')">
          <template #icon><icon-plus /></template>
          添加回调地址
        </a-button>
        <div>
          <a-button type="primary" @click="saveRedirectUris">保存</a-button>
        </div>
      </a-tab-pane>

      <!-- Tab 4: Scope 配置 -->
      <a-tab-pane key="scope" title="Scope 配置">
        <a-transfer
          v-model="selectedScopeIds"
          :data="allScopes"
          :title="['可选 Scope', '已选 Scope']"
          show-search
          style="margin-bottom: 16px"
        />
        <div>
          <a-button type="primary" @click="saveScopes">保存</a-button>
        </div>
      </a-tab-pane>
    </a-tabs>
  </a-drawer>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import {
  type Oauth2AppDetailResp,
  type Oauth2AppSecretResp,
  createAppSecret,
  deleteAppSecret,
  getApp,
  listAppSecret,
  updateAppRedirectUris,
  updateAppScopes,
} from '@/apis/oauth2/app'
import { listScope } from '@/apis/oauth2/scope'

const { width } = useWindowSize()

const dataId = ref<number>(0)
const dataDetail = ref<Oauth2AppDetailResp>()
const visible = ref(false)

// 应用类型映射
const appTypeMap: Record<number, string> = { 1: 'Web应用', 2: '移动应用', 3: '服务端应用' }

// 授权类型列表（从逗号分隔字符串解析）
const grantTypeList = computed(() => {
  const types = dataDetail.value?.allowedGrantTypes
  if (!types) return []
  return types.split(',').map((t) => t.trim()).filter(Boolean)
})

// ---- 密钥管理 ----
const secretList = ref<Oauth2AppSecretResp[]>([])
const secretLoading = ref(false)

const getSecretList = async () => {
  secretLoading.value = true
  try {
    const { data } = await listAppSecret(dataId.value)
    secretList.value = data
  } finally {
    secretLoading.value = false
  }
}

// 生成新密钥
const onCreateSecret = async () => {
  const { data } = await createAppSecret(dataId.value)
  Modal.success({
    title: '密钥创建成功',
    content: () =>
      h('div', [
        h('p', { style: 'margin-bottom: 8px; color: #ff7d00;' }, '密钥仅展示一次，请妥善保存！'),
        h(
          'p',
          { style: 'word-break: break-all; font-family: monospace; background: #f2f3f5; padding: 8px; border-radius: 4px;' },
          data.clientSecret,
        ),
      ]),
    okText: '我已保存',
    maskClosable: false,
  })
  getSecretList()
}

// 删除密钥
const onDeleteSecret = (record: Oauth2AppSecretResp) => {
  Modal.warning({
    title: '删除确认',
    content: '确定删除该密钥吗？删除后无法恢复。',
    hideCancel: false,
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      await deleteAppSecret(dataId.value, record.id)
      Message.success('删除成功')
      getSecretList()
    },
  })
}

// ---- 回调地址 ----
const redirectUris = ref<string[]>([])

const saveRedirectUris = async () => {
  try {
    await updateAppRedirectUris(dataId.value, redirectUris.value.filter((uri) => uri.trim()))
    Message.success('回调地址保存成功')
  } catch {
    // handled by http interceptor
  }
}

// ---- Scope 配置 ----
const allScopes = ref<Array<{ value: number, label: string }>>([])
const selectedScopeIds = ref<number[]>([])

const getAllScopes = async () => {
  const { data } = await listScope()
  allScopes.value = data.map((s) => ({ value: s.id, label: `${s.scopeCode} - ${s.scopeName}` }))
}

const saveScopes = async () => {
  try {
    await updateAppScopes(dataId.value, selectedScopeIds.value)
    Message.success('Scope 配置保存成功')
  } catch {
    // handled by http interceptor
  }
}

// ---- Tab 切换 ----
const onTabChange = (key: string | number) => {
  if (key === 'secret') {
    getSecretList()
  }
}

// ---- 打开 ----
const onOpen = async (id: number) => {
  dataId.value = id
  const { data } = await getApp(id)
  dataDetail.value = data
  redirectUris.value = [...(data.redirectUris || [])]
  selectedScopeIds.value = (data.scopes || []).map((s) => s.id)
  await getAllScopes()
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
