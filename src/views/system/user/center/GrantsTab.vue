<template>
  <div class="grants-tab">
    <div class="grants-tab__content">
      <a-table :data="grantList" :loading="loading" :pagination="false" row-key="appId" :scroll="{ y: 350 }">
        <template #columns>
          <a-table-column title="应用" data-index="appName">
            <template #cell="{ record }">
              <a-space>
                <a-avatar v-if="record.logo" :image-url="record.logo" :size="32" />
                <a-avatar v-else :size="32">{{ record.appName?.charAt(0) }}</a-avatar>
                <span>{{ record.appName }}</span>
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="授权范围" data-index="scope" />
          <a-table-column title="授权时间" data-index="grantedAt" />
          <a-table-column title="操作" :width="120">
            <template #cell="{ record }">
              <a-popconfirm content="确认撤销该应用的授权？" @ok="handleRevoke(record.appId)">
                <a-button type="text" status="danger" size="small">撤销</a-button>
              </a-popconfirm>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>
    <div v-if="grantList.length > 0" class="grants-tab__footer">
      <a-popconfirm content="确认撤销所有应用的授权？" @ok="handleRevokeAll">
        <a-button status="danger" long>撤销所有授权</a-button>
      </a-popconfirm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listUserGrants, revokeGrant, revokeAllGrants } from '@/apis/auth/grant'
import type { UserGrantItem } from '@/apis/auth/grant'

const loading = ref(false)
const grantList = ref<UserGrantItem[]>([])

const fetchList = async () => {
  loading.value = true
  try {
    const { data } = await listUserGrants()
    grantList.value = data
  } finally {
    loading.value = false
  }
}

const handleRevoke = async (appId: number) => {
  await revokeGrant(appId)
  Message.success('已撤销授权')
  fetchList()
}

const handleRevokeAll = async () => {
  await revokeAllGrants()
  Message.success('已撤销所有授权')
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
.grants-tab__content {
  height: 380px;
}
.grants-tab__footer {
  padding-top: 12px;
}
</style>
