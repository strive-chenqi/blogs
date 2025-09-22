import { GitContributors } from "/home/chenqi/vuepress-starter/node_modules/.pnpm/@vuepress+plugin-git@2.0.0-rc.88_vuepress@2.0.0-rc.20_@vuepress+bundler-vite@2.0.0-rc.2_d79b0ca82c926af9fe16e7b6da6adbe4/node_modules/@vuepress/plugin-git/lib/client/components/GitContributors.js";
import { GitChangelog } from "/home/chenqi/vuepress-starter/node_modules/.pnpm/@vuepress+plugin-git@2.0.0-rc.88_vuepress@2.0.0-rc.20_@vuepress+bundler-vite@2.0.0-rc.2_d79b0ca82c926af9fe16e7b6da6adbe4/node_modules/@vuepress/plugin-git/lib/client/components/GitChangelog.js";

export default {
  enhance: ({ app }) => {
    app.component("GitContributors", GitContributors);
    app.component("GitChangelog", GitChangelog);
  },
};
