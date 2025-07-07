import { defineConfig } from 'vitepress';
import { generateSidebar } from './utils/gennerateSidebar';
import llmstxt from 'vitepress-plugin-llms'


export default defineConfig({
  title: 'DocCollab',
  description: '一个开源的协同富文本文档编辑系统',
  head: [['link', { rel: 'icon', href: '/DocCollab/logo.png' }]],
  themeConfig: {
    nav: [
      { text: '💭 首页', link: '/' },
      { text: '🚀 快速开始', link: '/使用文档/快速开始' },
      { text: '⭐ 项目亮点', link: '/项目亮点/' },
      { text: '👫 参与贡献', link: '/贡献文档/' },
      { text: '🌞 关于训练营', link: '/关于训练营/' },
      { text: '👋 关于我们', link: '/about' },
    ],
    // 直接使用相对于 public 目录的路径
    logo: '/logo.png',
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present byteGanYue',
    },
    // 是否启动搜索功能
    search: {
      provider: 'local',
    },
    sidebar: generateSidebar(),
    socialLinks: [
      { icon: 'github', link: 'https://github.com/byteGanYue/DocCollab' },
    ],
  },
  base: '/DocCollab/',
  // 自定义主题颜色
  appearance: true,
  
  vite : {
    plugins: [
      llmstxt({
        generateLLMsFullTxt: false,
        ignoreFiles: ['sponsors/*'],
        customLLMsTxtTemplate: `# {title}\n\n{foo}`,
        title: 'Awesome tool',
        customTemplateVariables: {
          foo: 'bar'
        }
      })
    ],
    assetsInclude: ['**/*.PNG', '**/*.png', '**/*.jpg', '**/*.JPG', '**/*.jpeg', '**/*.JPEG', '**/*.gif', '**/*.GIF', '**/*.svg', '**/*.SVG']
  }
});
