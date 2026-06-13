<template>
  <a-modal
    :visible="visible"
    title="绑定多因素认证"
    :footer="false"
    :mask-closable="false"
    :unmount-on-close="true"
    width="480px"
    @cancel="handleCancel"
  >
    <MfaSetup mode="profile" @success="handleSuccess" @cancel="handleCancel" />
  </a-modal>
</template>

<script setup lang="ts">
import MfaSetup from '@/views/login/components/mfa/MfaSetup.vue'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  'success': []
}>()

const handleSuccess = () => {
  emit('update:visible', false)
  emit('success')
}

const handleCancel = () => {
  emit('update:visible', false)
}
</script>
