<template>
  <div class="gi_page">
    <a-row wrap :gutter="[16, 16]" align="stretch">
      <a-col :xs="24" :sm="24" :md="10" :lg="10" :xl="7" :xxl="7">
        <LeftBox />
      </a-col>
      <a-col :xs="24" :sm="24" :md="14" :lg="14" :xl="17" :xxl="17">
        <a-card bordered class="gradient-card">
          <a-tabs default-active-key="security">
            <a-tab-pane key="security" title="安全设置">
              <PasswordPolicy />
            </a-tab-pane>
            <a-tab-pane key="social" title="第三方账号">
              <RightBox />
            </a-tab-pane>
            <a-tab-pane key="grants" title="已授权应用">
              <GrantsTab />
            </a-tab-pane>
            <a-tab-pane key="sessions" title="活跃会话">
              <SessionsTab />
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import LeftBox from './BasicInfo.vue'
import RightBox from './Social.vue'
import PasswordPolicy from './Security.vue'
import GrantsTab from '@/views/system/user/center/GrantsTab.vue'
import SessionsTab from '@/views/system/user/center/SessionsTab.vue'

defineOptions({ name: 'UserProfile' })
</script>

<style scoped lang="scss">
.gi_page {
  background-color: var(--color-bg-1);
}
</style>
