<template>
  <div class="mfa-code-input" :class="{ 'is-error': isError, 'is-disabled': disabled }">
    <div class="code-boxes">
      <input
        v-for="(_, i) in digits"
        :key="i"
        ref="inputRefs"
        :value="digits[i]"
        type="text"
        inputmode="numeric"
        maxlength="1"
        :disabled="disabled"
        class="code-box"
        :class="{ filled: digits[i] }"
        @input="handleInput(i, $event)"
        @keydown="handleKeydown(i, $event)"
        @paste="handlePaste"
        @focus="handleFocus(i)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string
  length?: number
  disabled?: boolean
}>(), {
  modelValue: '',
  length: 6,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [val: string]
  'complete': [code: string]
}>()

const digits = ref<string[]>(Array.from({ length: props.length }, () => ''))
const inputRefs = ref<HTMLInputElement[]>([])
const isError = ref(false)

watch(() => props.modelValue, (val) => {
  if (!val) {
    digits.value = Array.from({ length: props.length }, () => '')
  }
})

const getCode = () => digits.value.join('')

const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const val = target.value.replace(/\D/g, '')
  digits.value[index] = val.slice(-1)
  target.value = digits.value[index]

  const code = getCode()
  emit('update:modelValue', code)
  isError.value = false

  if (val && index < props.length - 1) {
    nextTick(() => inputRefs.value[index + 1]?.focus())
  }

  if (code.length === props.length) {
    emit('complete', code)
  }
}

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace') {
    if (!digits.value[index] && index > 0) {
      digits.value[index - 1] = ''
      emit('update:modelValue', getCode())
      nextTick(() => inputRefs.value[index - 1]?.focus())
    } else {
      digits.value[index] = ''
      emit('update:modelValue', getCode())
    }
    event.preventDefault()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const paste = event.clipboardData?.getData('text')?.replace(/\D/g, '') || ''
  for (let i = 0; i < props.length; i++) {
    digits.value[i] = paste[i] || ''
  }
  emit('update:modelValue', getCode())

  const focusIndex = Math.min(paste.length, props.length - 1)
  nextTick(() => inputRefs.value[focusIndex]?.focus())

  if (paste.length >= props.length) {
    emit('complete', getCode())
  }
}

const handleFocus = (index: number) => {
  inputRefs.value[index]?.select()
}

const focus = () => {
  nextTick(() => inputRefs.value[0]?.focus())
}

const shake = () => {
  isError.value = true
  digits.value = Array.from({ length: props.length }, () => '')
  emit('update:modelValue', '')
  setTimeout(() => {
    isError.value = false
    focus()
  }, 600)
}

const clear = () => {
  digits.value = Array.from({ length: props.length }, () => '')
  emit('update:modelValue', '')
  focus()
}

defineExpose({ focus, shake, clear })
</script>

<style scoped lang="scss">
.mfa-code-input {
  .code-boxes {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .code-box {
    width: 44px;
    height: 52px;
    border: 1.5px solid var(--color-border-2);
    border-radius: 8px;
    text-align: center;
    font-size: 22px;
    font-weight: 600;
    font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
    color: var(--color-text-1);
    background: var(--color-bg-2);
    outline: none;
    transition: all 0.2s ease;
    caret-color: rgb(var(--primary-6));

    &:focus {
      border-color: rgb(var(--primary-6));
      box-shadow: 0 0 0 3px rgba(var(--primary-6), 0.12);
    }

    &.filled {
      border-color: rgb(var(--primary-5));
      background: rgba(var(--primary-1), 0.5);
    }
  }

  &.is-error .code-boxes {
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }

  &.is-error .code-box {
    border-color: rgb(var(--danger-6));
    background: rgba(var(--danger-1), 0.3);
  }

  &.is-disabled .code-box {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
</style>
