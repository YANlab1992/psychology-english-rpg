# 心理学英语大冒险：完整序幕 v1.0

一个面向心理学本科生专业英语课程的平面2D RPG完整序幕。游戏使用 TypeScript、Phaser 和 Vite，课程内容使用独立 JSON 配置，存档保存在浏览器 IndexedDB 中。

在线试玩：<https://yanlab1992.github.io/psychology-english-rpg/>

## 已实现内容

- 主菜单、进度读取、学习档案；
- 四段序幕剧情与1879年心理学实验室历史引入；
- 带碰撞、小地图、点击寻路和动态景物的平面2D校园；
- 颜教授、小搜、阿读等通俗角色；
- 领取任务、组建取证小队、角色状态反馈；
- 三个与校园情境直接关联的现场取证微关卡；
- behavior、mental process、scientific method 等术语档案；
- 支持鼠标和键盘的四题无惩罚摸底与分层反馈；
- 带实际攻击倒计时、点击移动和命中动效的“读心怪”证据战；
- 定义、观察、比较、限定四种学习技能；
- v1原型存档自动迁移、IndexedDB本地存档和JSON学习报告导出；
- 统一的像素校园美术、任务HUD、进度条、弹窗与通关评价；
- GitHub Pages自动部署工作流。

序幕内容仅使用教材第1章的基础定义与课程导入，不使用第7、8章 Reading 3。

## 本地运行

```bash
npm install
npm run dev
```

终端会显示本地网址，通常为 `http://localhost:5173`。

## 构建

```bash
npm run build
npm run preview
```

生产文件生成在 `docs/`，该目录同时是 GitHub Pages 的发布目录。

## 操作

- WASD / 方向键：移动；
- 鼠标点击地图：自动走向目标位置；
- Shift：冲刺；
- F / Enter：互动；
- Esc：退出现场取证界面或学习档案；
- Tab：学习档案；
- 数字键1–4：证据战技能；
- 所有按钮同时支持鼠标点击。

## GitHub Pages

当前站点从 `main` 分支的 `/docs` 目录发布。更新游戏后执行：

```bash
npm run build
git add .
git commit -m "Update game"
git push
```

GitHub Pages 会读取新提交的 `docs/` 内容并更新在线版本。

`vite.config.ts` 使用相对路径 `base: './'`，适合项目页面部署。

## 后续扩展

- 使用 Tiled JSON 替换程序化灰盒地图；
- 加入PWA离线缓存；
- 在真正需要反应时和实验流程的章节嵌入jsPsych；
- 接入教师端数据库前，先确定匿名标识、数据最小化和访问权限。
