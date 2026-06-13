<template>
  <div class="gi_page">
    <a-spin :loading="loading">
      <a-form
        ref="formRef"
        :model="form"
        auto-label-width
        label-align="left"
        :layout="width >= 500 ? 'horizontal' : 'vertical'"
        :disabled="!isUpdate"
        class="form"
      >
        <a-form-item
          field="MFA_FORCE_ENABLED"
          label="强制多因素认证"
          help="全局强制所有用户开启 MFA（开启后未绑定 MFA 的用户登录时将被引导完成绑定）"
        >
          <a-switch v-model="form.MFA_FORCE_ENABLED" type="round" checked-value="true" unchecked-value="false">
            <template #checked>开</template>
            <template #unchecked>关</template>
          </a-switch>
        </a-form-item>
        <a-space style="margin-bottom: 16px">
          <a-button v-if="!isUpdate" v-permission="['system:securityConfig:update']" type="primary" @click="onUpdate">
            <template #icon><icon-edit /></template>修改
          </a-button>
          <a-button v-if="isUpdate" type="primary" @click="handleSave">
            <template #icon><icon-save /></template>保存
          </a-button>
          <a-button v-if="isUpdate" @click="handleCancel">
            <template #icon><icon-undo /></template>取消
          </a-button>
        </a-space>
      </a-form>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { type FormInstance, Message } from '@arco-design/web-vue'
import { type OptionResp, listOption, updateOption } from '@/apis/system'

defineOptions({ name: 'SystemMfaConfig' })
const { width } = useWindowSize()

const loading = ref(false)
const formRef = ref<FormInstance>()
const form = ref({
  MFA_FORCE_ENABLED: 'false',
})

const mfaConfig = ref<OptionResp>()
const isUpdate = ref(false)

const onUpdate = () => {
  isUpdate.value = true
}

const handleCancel = () => {
  form.value.MFA_FORCE_ENABLED = mfaConfig.value?.value || 'false'
  isUpdate.value = false
}

const getDataList = async () => {
  loading.value = true
  try {
    const { data } = await listOption({ category: 'MFA' })
    const option = data.find((item: OptionResp) => item.code === 'MFA_FORCE_ENABLED')
    if (option) {
      mfaConfig.value = option
      form.value.MFA_FORCE_ENABLED = option.value
    }
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!mfaConfig.value) return
  await updateOption([
    { id: mfaConfig.value.id, code: 'MFA_FORCE_ENABLED', value: form.value.MFA_FORCE_ENABLED },
  ])
  await getDataList()
  isUpdate.value = false
  Message.success('保存成功')
}

onMounted(getDataList)
</script>

<style scoped lang="scss">
:deep(.arco-form-item.arco-form-item-has-help) {
  margin-bottom: 5px;
}
</style>
