---
layout: page
---
<script setup>
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers
} from 'vitepress/theme'

const members = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/146628596?v=4',
    name: 'Ni0duann',
    title: '💻 Frontend Developer && 📝 Backend Developer',
    links: [
      { icon: 'github', link: 'https://github.com/Ni0duann' },
    //   { icon: 'twitter', link: 'https://twitter.com/youyuxi' }
    ]
  },

      {
    avatar: 'https://avatars.githubusercontent.com/u/128409343?v=4',
    name: 'wenhuilan',
    title: '🍃 Frontend Developer',
    links: [
      { icon: 'github', link: 'https://github.com/wenhuilan' }
    ]
  },
  // 可以继续添加更多成员
        {
    avatar: 'https://avatars.githubusercontent.com/u/166977518?v=4',
    name: 'wangzimian',
    title: '🍃 Frontend Developer',
    links: [
      { icon: 'github', link: 'https://github.com/2042217959' }
    ]
  },
   {
    avatar: 'https://avatars.githubusercontent.com/u/148612270?v=4',
    name: 'L-L777',
    title: '🍃 Frontend Developer',
    links: [
      { icon: 'github', link: 'https://github.com/L-L777' }
    ]
  }
]
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      关于byteGanYue团队
    </template>
    <template #lead>
      DocCollab 由一群充满热情的在读大学生开发者构建，以下是我们的核心团队成员。
    </template>
  </VPTeamPageTitle>
  <VPTeamMembers
    :members="members"
  />
</VPTeamPage>