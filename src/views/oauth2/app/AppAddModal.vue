<!--
  ~ Copyright (c) 2022-present Charles7c Authors. All Rights Reserved.
  ~
  ~ Licensed under the Apache License, Version 2.0 (the "License");
  ~ you may not use this file except in compliance with the License.
  ~ You may obtain a copy of the License at
  ~
  ~     http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing, software
  ~ distributed under the License is distributed on an "AS IS" BASIS,
  ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  ~ See the License for the specific language governing permissions and
  ~ limitations under the License.
  -->

<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 650 ? 650 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="columns" />
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addApp, getApp, updateApp } from '@/apis/oauth2/app'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref<number | ''>('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改应用' : '新增应用'))
const formRef = ref<InstanceType<typeof GiForm>>()

const [form, resetForm] = useResetReactive({
  accessTokenTtl: 7200,
  refreshTokenTtl: 604800,
  allowSilentAuth: false,
  allowedGrantTypes: [] as string[],
})

const columns: ColumnItem[] = reactive([
  {
    label: '应用名称',
    field: 'appName',
    type: 'input',
    span: 24,
    required: true,
    props: { maxLength: 100, placeholder: '请输入应用名称' },
  },
  {
    label: '应用类型',
    field: 'appType',
    type: 'select',
    span: 24,
    required: true,
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
    label: '描述',
    field: 'description',
    type: 'textarea',
    span: 24,
    props: { maxLength: 500, placeholder: '请输入描述' },
  },
  {
    label: 'Logo URL',
    field: 'logo',
    type: 'input',
    span: 24,
    props: { maxLength: 500, placeholder: '请输入 Logo 图片地址' },
  },
  {
    label: '授权类型',
    field: 'allowedGrantTypes',
    type: 'checkbox-group',
    span: 24,
    required: true,
    props: {
      options: [
        { label: 'Authorization Code', value: 'authorization_code' },
        { label: 'Client Credentials', value: 'client_credentials' },
        { label: 'Refresh Token', value: 'refresh_token' },
        { label: 'Implicit', value: 'implicit' },
        { label: 'Password', value: 'password' },
      ],
    },
  },
  {
    label: 'Access Token 有效期(秒)',
    field: 'accessTokenTtl',
    type: 'input-number',
    span: 12,
    props: { min: 60, placeholder: '默认 7200' },
  },
  {
    label: 'Refresh Token 有效期(秒)',
    field: 'refreshTokenTtl',
    type: 'input-number',
    span: 12,
    props: { min: 60, placeholder: '默认 604800' },
  },
  {
    label: '允许静默授权',
    field: 'allowSilentAuth',
    type: 'switch',
    span: 24,
    props: { type: 'round', checkedValue: true, uncheckedValue: false },
  },
])

const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
}

const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    // allowedGrantTypes 前端为数组，提交时转为逗号分隔字符串
    const submitData = { ...form, allowedGrantTypes: (form.allowedGrantTypes as string[]).join(',') }
    if (isUpdate.value) {
      await updateApp(submitData, dataId.value as number)
      Message.success('修改成功')
    } else {
      await addApp(submitData)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch {
    return false
  }
}

const onAdd = () => {
  reset()
  dataId.value = ''
  visible.value = true
}

const onUpdate = async (id: number) => {
  reset()
  dataId.value = id
  const { data } = await getApp(id)
  Object.assign(form, {
    ...data,
    // allowedGrantTypes 后端为逗号分隔字符串，加载时转为数组
    allowedGrantTypes: data.allowedGrantTypes ? data.allowedGrantTypes.split(',') : [],
  })
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>
