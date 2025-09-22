import { CodeTabs } from "/home/chenqi/vuepress-starter/node_modules/.pnpm/@vuepress+plugin-markdown-tab@2.0.0-rc.86_markdown-it@14.1.0_vuepress@2.0.0-rc.20_@vuep_519cbe488178dc549e60cdbd93b66e88/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/CodeTabs.js";
import { Tabs } from "/home/chenqi/vuepress-starter/node_modules/.pnpm/@vuepress+plugin-markdown-tab@2.0.0-rc.86_markdown-it@14.1.0_vuepress@2.0.0-rc.20_@vuep_519cbe488178dc549e60cdbd93b66e88/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/Tabs.js";
import "/home/chenqi/vuepress-starter/node_modules/.pnpm/@vuepress+plugin-markdown-tab@2.0.0-rc.86_markdown-it@14.1.0_vuepress@2.0.0-rc.20_@vuep_519cbe488178dc549e60cdbd93b66e88/node_modules/@vuepress/plugin-markdown-tab/lib/client/styles/vars.css";

export default {
  enhance: ({ app }) => {
    app.component("CodeTabs", CodeTabs);
    app.component("Tabs", Tabs);
  },
};
