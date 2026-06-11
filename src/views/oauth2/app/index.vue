<template>
  <GiPageLayout>
    <GiTable
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1300 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['appName']"
      @refresh="search"
    >
      <template #top>
        <GiForm v-model="queryForm" search :columns="queryFormColumns" size="medium" @search="search" @reset="reset"></GiForm>
      </template>
      <template #toolbar-left>
        <a-button v-permission="['oauth2:app:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>
      <template #appName="{ record }">
        <a-link @click="onDetail(record)">{{ record.appName }}</a-link>
      </template>
      <template #appType="{ record }">
        <a-tag v-if="record.appType === 1" color="arcoblue">Web应用</a-tag>
        <a-tag v-else-if="record.appType === 2" color="green">移动应用</a-tag>
        <a-tag v-else-if="record.appType === 3" color="orangered">服务端应用</a-tag>
      </template>
      <template #status="{ record }">
        <a-switch
          v-if="has.hasPerm('oauth2:app:update')"
          v-model="record.status"
          :checked-value="1"
          :unchecked-value="2"
          @change="(val: number) => onStatusChange(record.id, val)"
        />
        <GiCellStatus v-else :status="record.status" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['oauth2:app:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['oauth2:app:delete']"
            status="danger"
            :disabled="record.disabled"
            :title="record.disabled ? '禁止删除' : '删除'"
            @click="onDelete(record)"
          >
            删除
          </a-link>
        </a-space>
      </template>
    </GiTable>

    <AppAddModal ref="AppAddModalRef" @save-success="search" />
    <AppDetailDrawer ref="AppDetailDrawerRef" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import { Message, type TableInstance } from '@arco-design/web-vue'
import AppAddModal from './AppAddModal.vue'
import AppDetailDrawer from './AppDetailDrawer.vue'
import { type Oauth2AppResp, deleteApp, listApp, updateAppStatus } from '@/apis/oauth2/app'
import { DisEnableStatusList } from '@/constant/common'
import { useResetReactive, useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import type { ColumnItem } from '@/components/GiForm'

defineOptions({ name: 'Oauth2App' })

const [queryForm, resetForm] = useResetReactive({
  sort: ['createTime,desc'],
})
const queryFormColumns: ColumnItem[] = reactive([
  {
    type: 'input',
    label: '应用名称',
    field: 'appName',
    span: { xs: 24, sm: 8, xxl: 8 },
    props: { placeholder: '搜索应用名称' },
  },
  {
    type: 'select',
    label: '应用类型',
    field: 'appType',
    span: { xs: 24, sm: 8, xxl: 8 },
    props: {
      options: [
        { label: 'Web应用', value: 1 },
        { label: '移动应用', value: 2 },
        { label: '服务端应用', value: 3 },
      ],
      placeholder: '请选择应用类型',
    },
  },
  {
    type: 'select',
    label: '状态',
    field: 'status',
    span: { xs: 24, sm: 8, xxl: 8 },
    props: { options: DisEnableStatusList, placeholder: '请选择状态' },
  },
])

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listApp({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize),
    fixed: !isMobile() ? 'left' : undefined,
  },
  {
    title: '应用名称',
    dataIndex: 'appName',
    slotName: 'appName',
    ellipsis: true,
    tooltip: true,
    fixed: !isMobile() ? 'left' : undefined,
  },
  { title: '应用类型', dataIndex: 'appType', slotName: 'appType', width: 120, align: 'center' },
  { title: 'Client ID', dataIndex: 'clientId', ellipsis: true, tooltip: true },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 80, align: 'center' },
  { title: '创建人', dataIndex: 'createUserString', ellipsis: true, tooltip: true, show: false },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 120,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['oauth2:app:get', 'oauth2:app:update', 'oauth2:app:delete']),
  },
]

// 重置
const reset = () => {
  resetForm()
  search()
}

// 删除
const onDelete = (record: Oauth2AppResp) => {
  return handleDelete(() => deleteApp(record.id), {
    content: `是否确定删除应用「${record.appName}」？`,
    showModal: true,
  })
}

// 状态切换
const onStatusChange = async (id: number, status: number) => {
  try {
    await updateAppStatus(id, status)
    Message.success('状态修改成功')
  } catch {
    search()
  }
}

const AppAddModalRef = ref<InstanceType<typeof AppAddModal>>()
// 新增
const onAdd = () => {
  AppAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: Oauth2AppResp) => {
  AppAddModalRef.value?.onUpdate(record.id)
}

const AppDetailDrawerRef = ref<InstanceType<typeof AppDetailDrawer>>()
// 详情
const onDetail = (record: Oauth2AppResp) => {
  AppDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
