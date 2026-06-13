<template>
  <div class="mfa-recovery-codes">
    <div class="warning-banner">
      <icon-exclamation-circle-fill :size="18" class="warning-icon" />
      <div class="warning-text">
        <strong>请妥善保存恢复码</strong>
        <p>每个恢复码仅能使用一次，关闭后将无法再次查看。建议下载保存至安全位置。</p>
      </div>
    </div>
    <div class="codes-grid">
      <div v-for="(code, index) in codes" :key="index" class="code-item">
        <span class="code-index">{{ index + 1 }}</span>
        <span class="code-value">{{ code }}</span>
      </div>
    </div>
    <div class="actions">
      <a-button type="outline" @click="handleCopy">
        <template #icon><icon-copy /></template>
        复制全部
      </a-button>
      <a-button type="outline" @click="handleDownload">
        <template #icon><icon-download /></template>
        下载文件
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
  const text = `Heimdall MFA 恢复码\n${'─'.repeat(30)}\n\n${props.codes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n⚠ 每个恢复码只能使用一次，请妥善保存。`
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
  .warning-banner {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    background: rgba(var(--orange-1), 0.8);
    border: 1px solid rgba(var(--orange-3), 0.6);
    border-radius: 8px;
    margin-bottom: 16px;

    .warning-icon {
      color: rgb(var(--orange-6));
      flex-shrink: 0;
      margin-top: 1px;
    }

    .warning-text {
      strong {
        font-size: 13px;
        color: var(--color-text-1);
        display: block;
        margin-bottom: 2px;
      }

      p {
        font-size: 12px;
        color: var(--color-text-2);
        margin: 0;
        line-height: 1.5;
      }
    }
  }

  .codes-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  .code-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--color-fill-1);
    border: 1px dashed var(--color-border-2);
    border-radius: 6px;
    transition: background 0.2s;

    &:hover {
      background: var(--color-fill-2);
    }

    .code-index {
      font-size: 11px;
      color: var(--color-text-4);
      width: 16px;
      text-align: center;
    }

    .code-value {
      font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-1);
      letter-spacing: 1.5px;
    }
  }

  .actions {
    display: flex;
    gap: 12px;
  }
}
</style>
