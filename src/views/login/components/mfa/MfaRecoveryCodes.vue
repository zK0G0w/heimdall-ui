<template>
  <div class="mfa-recovery-codes">
    <a-alert type="warning" class="mb-4">
      请妥善保存以下恢复码，每个恢复码只能使用一次。关闭后无法再次查看。
    </a-alert>
    <div class="codes-grid">
      <div v-for="(code, index) in codes" :key="index" class="code-item">
        {{ code }}
      </div>
    </div>
    <div class="actions">
      <a-button @click="handleCopy">
        <template #icon><icon-copy /></template>
        复制全部
      </a-button>
      <a-button @click="handleDownload">
        <template #icon><icon-download /></template>
        下载为文本
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useClipboard } from '@vueuse/core'

const props = defineProps<{
  codes: string[]
}>()

const { copy } = useClipboard()

const handleCopy = async () => {
  const text = props.codes.join('\n')
  await copy(text)
  Message.success('已复制到剪贴板')
}

const handleDownload = () => {
  const text = `Heimdall MFA 恢复码\n${'='.repeat(30)}\n\n${props.codes.join('\n')}\n\n请妥善保存，每个恢复码只能使用一次。`
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'heimdall-recovery-codes.txt'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped lang="scss">
.mfa-recovery-codes {
  .mb-4 {
    margin-bottom: 16px;
  }

  .codes-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  .code-item {
    padding: 8px 12px;
    background: var(--color-fill-2);
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
    text-align: center;
    letter-spacing: 1px;
  }

  .actions {
    display: flex;
    gap: 12px;
  }
}
</style>
