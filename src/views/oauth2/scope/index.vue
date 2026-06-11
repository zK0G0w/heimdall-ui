<template>
  <GiPageLayout>
    <GiTable
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 900 }"
      :disabled-tools="['size']"
      :disabled-column-keys="['scopeCode']"
      @refresh="getDataList"
    >
      <template #toolbar-right>
        <a-button v-permission="['oauth2:scope:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['oauth2:scope:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['oauth2:scope:delete']" status="danger" title="删除" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <ScopeAddModal ref="ScopeAddModalRef" @save-success="getDataList" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import ScopeAddModal from './ScopeAddModal.vue'
import { type Oauth2ScopeResp, deleteScope, listScope } from '@/apis/oauth2/scope'
import has from '@/utils/has'

defineOptions({ name: 'Oauth2Scope' })

const loading = ref(false)
const dataList = ref<Oauth2ScopeResp[]>([])

const getDataList = async () => {
  loading.value = true
  try {
    const { data } = await listScope()
    dataList.value = data
  } finally {
    loading.value = false
  }
}

const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1),
  },
  { title: 'Scope 标识', dataIndex: 'scopeCode', ellipsis: true, tooltip: true },
  { title: 'Scope 名称', dataIndex: 'scopeName', ellipsis: true, tooltip: true },
  { title: '描述', dataIndex: 'description', ellipsis: true, tooltip: true },
  { title: '创建人', dataIndex: 'createUserString', ellipsis: true, tooltip: true },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 120,
    align: 'center',
    show: has.hasPermOr(['oauth2:scope:update', 'oauth2:scope:delete']),
  },
]

// 删除
const onDelete = (record: Oauth2ScopeResp) => {
  Modal.warning({
    title: '提示',
    content: `是否确定删除 Scope「${record.scopeName}」？`,
    okButtonProps: { status: 'danger' },
    hideCancel: false,
    maskClosable: false,
    onBeforeOk: async () => {
      try {
        await deleteScope(record.id)
        Message.success('删除成功')
        getDataList()
        return true
      } catch {
        return false
      }
    },
  })
}

const ScopeAddModalRef = ref<InstanceType<typeof ScopeAddModal>>()

// 新增
const onAdd = () => {
  ScopeAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: Oauth2ScopeResp) => {
  ScopeAddModalRef.value?.onUpdate(record)
}

onMounted(() => {
  getDataList()
})
</script>

<style scoped lang="scss"></style>
