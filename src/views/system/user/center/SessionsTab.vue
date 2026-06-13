<template>
  <div class="sessions-tab">
    <a-space direction="vertical" fill>
      <a-table :data="sessionList" :loading="loading" :pagination="false" row-key="tokenValue">
        <template #columns>
          <a-table-column title="设备类型" data-index="deviceType" />
          <a-table-column title="登录 IP" data-index="loginIp" />
          <a-table-column title="登录时间" data-index="loginTime" />
          <a-table-column title="状态" :width="100">
            <template #cell="{ record }">
              <a-tag v-if="record.isCurrent" color="green">当前</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="120">
            <template #cell="{ record }">
              <a-popconfirm
                v-if="!record.isCurrent"
                content="确认踢出该设备？"
                @ok="handleKickout(record.tokenValue)"
              >
                <a-button type="text" status="danger" size="small">踢出</a-button>
              </a-popconfirm>
              <span v-else class="text-gray">-</span>
            </template>
          </a-table-column>
        </template>
      </a-table>
      <a-popconfirm
        v-if="sessionList.length > 1"
        content="确认退出所有其他设备？"
        @ok="handleKickoutAll"
      >
        <a-button status="warning" long>退出所有其他设备</a-button>
      </a-popconfirm>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listUserSessions, kickoutSession, kickoutAllSessions } from '@/apis/auth/session'
import type { UserSessionItem } from '@/apis/auth/session'

const loading = ref(false)
const sessionList = ref<UserSessionItem[]>([])

const fetchList = async () => {
  loading.value = true
  try {
    const { data } = await listUserSessions()
    sessionList.value = data
  } finally {
    loading.value = false
  }
}

const handleKickout = async (tokenValue: string) => {
  await kickoutSession(tokenValue)
  Message.success('已踢出')
  fetchList()
}

const handleKickoutAll = async () => {
  await kickoutAllSessions()
  Message.success('已退出所有其他设备')
  fetchList()
}

onMounted(fetchList)
</script>
