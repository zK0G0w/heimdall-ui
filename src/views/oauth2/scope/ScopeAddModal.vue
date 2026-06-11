<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 500 ? 500 : '100%'"
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
import { type Oauth2ScopeResp, addScope, updateScope } from '@/apis/oauth2/scope'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref<number | ''>('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改 Scope' : '新增 Scope'))
const formRef = ref<InstanceType<typeof GiForm>>()

const [form, resetForm] = useResetReactive({})

const columns: ColumnItem[] = reactive([
  {
    label: 'Scope 标识',
    field: 'scopeCode',
    type: 'input',
    span: 24,
    required: true,
    disabled: () => isUpdate.value,
    props: { maxLength: 50, placeholder: '请输入 Scope 标识' },
  },
  {
    label: 'Scope 名称',
    field: 'scopeName',
    type: 'input',
    span: 24,
    required: true,
    props: { maxLength: 100, placeholder: '请输入 Scope 名称' },
  },
  {
    label: '描述',
    field: 'description',
    type: 'textarea',
    span: 24,
    props: { maxLength: 500, placeholder: '请输入描述' },
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
    if (isUpdate.value) {
      await updateScope(form, dataId.value as number)
      Message.success('修改成功')
    } else {
      await addScope(form)
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

const onUpdate = (record: Oauth2ScopeResp) => {
  reset()
  dataId.value = record.id
  Object.assign(form, record)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>
