# `xiaoshuo` 使用教程

这份教程按“本地素材导入 -> 多书学习 -> 混合风格卡 -> 写作/改稿”来走。

## 1. 启动项目

```bash
cd /Users/zhaojiapeng/App/xiaoshuo
npm install
npm run dev
```

浏览器打开本地地址，例如：

```text
http://localhost:3001/
```

先在终端确认 Codex 可用：

```bash
codex --version
codex login
```

## 2. 新建你的小说项目

在首页的“新建小说项目”里填写：

- 书名
- 题材
- premise

`premise` 最好写清：

- 主角是谁
- 想要什么
- 会遇到什么阻力
- 卖点是什么

## 3. 导入参考素材

### 方式 A：导入单段正文

适合先快速试风格卡。

在“导入片段并生成风格卡”里贴入一段你喜欢的正文，系统会提取：

- 句长
- 对白比例
- 场景切换
- 感官密度
- anti-AI 改写重点

### 方式 B：批量导入本地小说文件夹

适合你已经下载好了很多本小说。

在“批量读取本地小说文件夹”里填写：

- 文件夹路径
- 素材来源
- 素材集合名
- 备注

当前支持：

- `.txt`
- `.md`

系统会：

1. 扫描文件夹里的文本文件
2. 为每个文件建立一条参考素材记录
3. 按标题或 `第X章` 这类标题行切分章节片段
4. 为每个文件生成一张风格卡

适合的目录示例：

```text
/Users/you/Downloads/novels/
  热血样本A.txt
  都市样本B.md
  悬疑样本C.txt
```

## 4. 同时参考多本小说

这是推荐用法。

不要只盯着一本书去“模仿”，而是拆成几个维度：

- A 书学对白压强
- B 书学章末悬压
- C 书学场景切换
- D 书学信息释放节奏

导入多本书之后，到“混合多本小说的写法”里：

1. 填一个混合卡名称
2. 写清混合说明
3. 勾选至少两张风格卡
4. 生成混合卡

这样得到的是“混合风格卡”，不是作者仿写卡。

## 5. 怎么让系统持续学习

最稳的办法不是“让 AI 自己记着”，而是把学习过程结构化：

### 第一层：素材学习

持续导入新样本，让系统记录：

- 参考素材
- 章节片段
- 每本书的风格卡

### 第二层：混合学习

每遇到一个新题材或新需求，就新建一张混合卡，例如：

- 都市高压对白混合卡
- 女频悬压推进混合卡
- 热血快节奏战斗混合卡

### 第三层：写后学习

你写完章节后，再做：

- `review`
- `humanize`
- 重新总结本章暴露出的 AI 味问题

把这些问题回收成下一轮的 anti-AI 重点。

### 第四层：反向学习你自己

当你写出满意的章节，也可以把你自己的成稿再导回参考库。

这样系统会慢慢形成“你的写作画像”，而不只是学别人。

## 6. 一键生成章节的推荐流程

目前推荐这套顺序：

1. 新建项目
2. 先整理项目 canon
3. 导入多本参考小说
4. 生成多张风格卡
5. 混合成当前项目专用风格卡
6. 用 canon 生成下一章 brief
7. 队列里加 `plan` 或直接 `write`
8. 跑 continuity check
9. 回写 canon
10. 队列里加 `humanize`
11. 队列里加 `review`

如果你还没有把书想清楚，不要直接填“新建项目”那三个字段，现在更推荐先走：

```text
/wizard/new-novel
```

或者在对话里直接说：

```text
使用 novel-init-wizard，为我创建一本修仙小说项目。
```

这个向导会逐题问你：

- 书名
- 题材
- 世界壳子
- 主角模板
- 核心能力
- 驱动力
- 关键同伴
- 阶段反派
- 写法节奏
- 第一卷目标
- 开篇钩子

然后自动生成：

- 项目
- 初始 canon
- 首卷方案
- 第1章 brief

## 统一入口 skill

如果你不想记一堆 skill 名，以后更推荐只记一个：

```text
xiaoshuo-studio
```

它会自动判断你是在做：

- 建书
- 导入参考
- 分析/混合风格
- 生成 brief
- 写作
- 审校
- 回写 canon

开源后可以导出两种模式：

```bash
npm run skills:export -- --target codex --mode aggregator-only
npm run skills:export -- --target codex --mode full-bundle
```

前者只装总入口，后者总入口和全部子 skill 一起装。

### 6.1 什么是项目 canon

长篇小说最怕的不是写不出来，而是：

- 人物状态忘了
- 伏笔埋了不收
- 时间线打架
- 模型明明看过前文却还是胡写

所以现在建议你把“记忆”拆成结构化项目档案：

- `story_bible`
- `characters`
- `locations`
- `timeline`
- `foreshadowing`
- `open_threads`
- `writing_rules`

这些内容会以 Markdown snapshot 存在本地，同时被索引进 SQLite，供 dashboard、API 和 skill 共用。

### 6.2 新的一章怎么生成

推荐顺序变成：

1. 用 `POST /api/canon/refresh` 更新当前项目 canon
2. 用 `POST /api/chapters/brief` 生成下一章 brief
3. 让 Codex 或 antigravity 按 brief 写章节
4. 用 `POST /api/chapters/continuity-check` 先查硬冲突
5. 草稿确认后，用 `POST /api/chapters/update-canon` 回写人物状态、时间线、开放线头

这样模型不是“自己记着”，而是“每次写之前都重新取一份最小充分上下文”。

如果你直接在 Codex 里操作，可以说：

```text
使用 webnovel-import-folder skill，导入 /Users/you/Downloads/novels
```

然后：

```text
使用 webnovel-blend-style skill，混合 “热血样本A”“都市样本B”“悬疑样本C”
```

然后：

```text
使用 webnovel-plan skill，为《债火登仙》规划第一卷前三章
```

再：

```text
使用 novel-load-context skill，读取《债火登仙》的项目 canon 和最近章节
```

再：

```text
使用 novel-plan-next skill，为《债火登仙》第2章生成 brief，重点推进“黑水城追债”
```

再：

```text
使用 webnovel-write 或 novel-draft-scene skill，生成第2章，并参考当前混合风格卡，减少解释腔和抽象抒情
```

然后：

```text
使用 novel-continuity-review skill，检查这一章是否和已有设定冲突
```

最后：

```text
使用 novel-update-canon skill，把这一章新增事实、角色状态变化和伏笔状态回写进项目 canon
```

## 7. 怎么避免“AI 味”

最有效的不是一句“写得自然一点”，而是明确改这些：

- 少解释，多场景
- 少抽象情绪词，多动作和感官
- 少平均句式，多节奏断裂
- 少结论先行，多冲突推进
- 少模板化章末总结，多即时悬压

可以把 anti-AI 重点长期固定成几类：

- 减少解释腔
- 用动作承载情绪
- 打断均匀句式
- 加强章末悬压
- 保留具体细节密度

## 8. 边界说明

这个系统的方向是：

- 学技法
- 学节奏
- 学信息释放
- 学钩子设计

不是：

- 直接克隆某位作者声线
- 生成“像某某作者”的复刻文本

推荐始终保持“拆风格不仿声”。

## 9. 怎么避免“写到后面忘前文”

关键不是让模型“背更多文字”，而是让项目先给它一份固定格式的事实包。

每轮都建议固定执行：

1. 先刷新 canon
2. 再生成 chapter brief
3. 写完先跑 continuity check
4. 确认可用后立刻 update canon

如果省掉后两步，长篇里最容易出现：

- 人物状态回滚
- 谁知道什么被写乱
- 伏笔回收状态丢失
- 同一地点和时间线互相打架
