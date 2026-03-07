import {
  BookOpenText,
  BrainCircuit,
  Flame,
  Radar,
  Sparkles,
  Sword,
} from "lucide-react";
import Link from "next/link";

import {
  createProjectAction,
  createBlendStyleAction,
  ingestExcerptAction,
  importFolderAction,
  ingestUrlAction,
  queueJobAction,
} from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { getStudioHomeData } from "@/lib/server/studio-service";

export default async function Home() {
  const { codex, snapshot } = await getStudioHomeData();
  const projects = snapshot.projects as Array<{
    genre: string;
    id: number;
    premise: string;
    status: string;
    title: string;
  }>;
  const references = snapshot.references as Array<{
    creatorLabel: string;
    sourceLabel: string;
    sourceType: string;
    title: string;
  }>;
  const styleProfiles = snapshot.styleProfiles as Array<{
    id: number;
    antiPatterns: string[];
    name: string;
    summary: string;
  }>;
  const blendProfiles = (snapshot.blendProfiles ?? []) as Array<{
    antiPatterns: string[];
    name: string;
    summary: string;
  }>;
  const jobs = snapshot.jobs as Array<{
    jobType: string;
    payload: Record<string, unknown>;
    projectId: number;
    status: string;
  }>;

  return (
    <main className="studio-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Codex-first fiction studio</p>
          <h1>写作、拆风格、去 AI 味，在一个本地工作台里完成。</h1>
          <p className="hero-summary">
            `xiaoshuo` 把项目管理、参考素材拆解、风格卡生成、任务排队和
            Codex 健康检查合在一处。它学习的是技法，不是具体作者声线。
          </p>
          <div className="hero-pills">
            <span>本地单用户</span>
            <span>Codex CLI 驱动</span>
            <span>Canon Lab + Style Lab</span>
          </div>
          <div className="wizard-actions hero-actions">
            <Link className="studio-link" href="/wizard/new-novel">
              启动深度建书向导
            </Link>
          </div>
        </div>
        <aside className="status-board">
          <div className="status-row">
            <span>Codex 状态</span>
            <strong>{codex.available ? "Ready" : "Missing"}</strong>
          </div>
          <p>{codex.message}</p>
          <small>{codex.version ? `Version ${codex.version}` : codex.hint}</small>
        </aside>
      </section>

      <section className="metric-grid">
        <MetricCard
          icon={<BookOpenText size={18} />}
          label="Projects"
          value={snapshot.metrics.projects}
        />
        <MetricCard
          icon={<Sparkles size={18} />}
          label="References"
          value={snapshot.metrics.references}
        />
        <MetricCard
          icon={<BrainCircuit size={18} />}
          label="Style Cards"
          value={snapshot.metrics.styleProfiles}
        />
        <MetricCard
          icon={<BookOpenText size={18} />}
          label="Canon Docs"
          value={snapshot.metrics.canonDocuments ?? 0}
        />
        <MetricCard
          icon={<Sparkles size={18} />}
          label="Blend Cards"
          value={snapshot.metrics.blendProfiles ?? 0}
        />
        <MetricCard
          icon={<BookOpenText size={18} />}
          label="Ref Chapters"
          value={snapshot.metrics.referenceChapters ?? 0}
        />
        <MetricCard
          icon={<Radar size={18} />}
          label="Draft States"
          value={snapshot.metrics.chapterDrafts ?? 0}
        />
        <MetricCard
          icon={<Radar size={18} />}
          label="Queued Jobs"
          value={snapshot.metrics.queuedJobs}
        />
      </section>

      <section className="panel-grid">
        <article className="panel">
          <SectionHeader
            eyebrow="Projects"
            icon={<Sword size={18} />}
            title="新建小说项目"
          />
          <form action={createProjectAction} className="form-grid">
            <label>
              书名
              <input name="title" placeholder="债火登仙" required />
            </label>
            <label>
              题材
              <input name="genre" placeholder="玄幻 / 悬疑 / 现言" required />
            </label>
            <label className="full-span">
              premise
              <textarea
                name="premise"
                placeholder="一句话说明主角、欲望、阻力、卖点。"
                required
                rows={4}
              />
            </label>
            <SubmitButton idleLabel="创建项目" pendingLabel="创建中..." />
          </form>
          <DataList
            empty="还没有项目。先创建一个项目，再给它添加风格卡和任务。"
            items={projects.map((item) => ({
              body: item.premise,
              meta: `${item.genre} · ${item.status}`,
              title: item.title,
            }))}
          />
        </article>

        <article className="panel">
          <SectionHeader
            eyebrow="Style Lab"
            icon={<BrainCircuit size={18} />}
            title="导入片段并生成风格卡"
          />
          <form action={ingestExcerptAction} className="form-grid">
            <label>
              样本标题
              <input name="title" placeholder="第一章样本" required />
            </label>
            <label>
              来源标记
              <input name="authorHint" placeholder="只供你自己识别" required />
            </label>
            <label className="full-span">
              摘录正文
              <textarea
                name="text"
                placeholder="粘贴 80 字以上的参考片段，系统会提取节奏、对白比和 anti-AI 改写重点。"
                required
                rows={8}
              />
            </label>
            <label className="full-span">
              备注
              <textarea
                name="notes"
                placeholder="例如：章末钩子强，情绪转折靠动作完成。"
                rows={3}
              />
            </label>
            <SubmitButton idleLabel="生成风格卡" pendingLabel="分析中..." />
          </form>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <SectionHeader
            eyebrow="Corpus Import"
            icon={<BookOpenText size={18} />}
            title="批量读取本地小说文件夹"
          />
          <form action={importFolderAction} className="form-grid">
            <label>
              文件夹路径
              <input
                name="folderPath"
                placeholder="/Users/you/Downloads/novels"
                required
              />
            </label>
            <label>
              素材来源
              <input name="creatorLabel" placeholder="本地下载 / 自存样本" required />
            </label>
            <label>
              素材集合名
              <input name="collectionName" placeholder="女频节奏样本库" required />
            </label>
            <label className="full-span">
              备注
              <textarea
                name="notes"
                placeholder="支持 txt / md。系统会按标题或“第X章”切分并记录章节片段。"
                rows={3}
              />
            </label>
            <SubmitButton idleLabel="批量导入并分析" pendingLabel="导入中..." />
          </form>
          <p className="micro-copy">
            适合一次读入多本本地小说，用来生成多张风格卡并记录章节片段。
          </p>
        </article>

        <article className="panel">
          <SectionHeader
            eyebrow="Crawler"
            icon={<Radar size={18} />}
            title="抓取可访问网页样本"
          />
          <form action={ingestUrlAction} className="form-grid">
            <label>
              标题
              <input name="title" placeholder="网页样本文标题" required />
            </label>
            <label>
              来源标记
              <input name="authorHint" placeholder="作者或账号备注" required />
            </label>
            <label className="full-span">
              URL
              <input
                name="url"
                placeholder="https://example.com/chapter-1"
                required
                type="url"
              />
            </label>
            <label className="full-span">
              备注
              <textarea
                name="notes"
                placeholder="支持公开页面，或浏览器 profile 已登录可访问的页面。"
                rows={3}
              />
            </label>
            <SubmitButton idleLabel="抓取并分析" pendingLabel="抓取中..." />
          </form>
          <p className="micro-copy">
            登录站点依赖本地 `browser-profile` 会话，不做 DRM 或反爬绕过。
          </p>
        </article>

        <article className="panel">
          <SectionHeader
            eyebrow="Draft Queue"
            icon={<Flame size={18} />}
            title="把工作流任务排队"
          />
          <form action={queueJobAction} className="form-grid">
            <label>
              项目
              <select defaultValue="" name="projectId" required>
                <option disabled value="">
                  选择项目
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              任务
              <select defaultValue="plan" name="jobType" required>
                <option value="plan">plan</option>
                <option value="write">write</option>
                <option value="humanize">humanize</option>
                <option value="review">review</option>
                <option value="analyze-style">analyze-style</option>
              </select>
            </label>
            <label className="full-span">
              目标章节
              <input defaultValue="1" min="1" name="chapter" required type="number" />
            </label>
            <SubmitButton idleLabel="加入队列" pendingLabel="入队中..." />
          </form>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <SectionHeader
            eyebrow="Blend Lab"
            icon={<BrainCircuit size={18} />}
            title="混合多本小说的写法"
          />
          <form action={createBlendStyleAction} className="form-grid">
            <label>
              混合卡名称
              <input name="name" placeholder="都市快压对白混合卡" required />
            </label>
            <label className="full-span">
              混合说明
              <textarea
                name="notes"
                placeholder="例如：A 书学对白压强，B 书学章末悬压，C 书学短句推进。"
                rows={3}
              />
            </label>
            <fieldset className="full-span checkbox-grid">
              <legend>选择至少两张风格卡</legend>
              {styleProfiles.length === 0 ? (
                <p className="empty-state">先导入样本，生成至少两张风格卡。</p>
              ) : (
                styleProfiles.map((profile) => (
                  <label className="checkbox-row" key={profile.id}>
                    <input
                      name="styleProfileIds"
                      type="checkbox"
                      value={profile.id}
                    />
                    <span>
                      <strong>{profile.name}</strong>
                      <small>{profile.summary}</small>
                    </span>
                  </label>
                ))
              )}
            </fieldset>
            <SubmitButton idleLabel="生成混合卡" pendingLabel="生成中..." />
          </form>
        </article>

        <article className="panel">
          <SectionHeader
            eyebrow="Learn Lab"
            icon={<Sparkles size={18} />}
            title="学习闭环"
          />
          <ol className="practice-list">
            <li>只提取节奏、对白比例、镜头切换、钩子强度，不复刻作者声线。</li>
            <li>把 AI 味拆成可改项：解释腔、模板腔、无动作心理、句式过匀。</li>
            <li>先让 Codex 起草，再用风格卡和 anti-AI 清单进行二次重写。</li>
            <li>审查只看叙事有效性和自然度，不追求“像某位作者”。</li>
          </ol>
        </article>

        <article className="panel">
          <SectionHeader
            eyebrow="Style Cards"
            icon={<BrainCircuit size={18} />}
            title="当前风格卡"
          />
          <DataList
            empty="还没有风格卡。先导入一段正文或抓取一个样本页面。"
            items={styleProfiles.map((item) => ({
              body: item.summary,
              meta: item.antiPatterns.join(" · "),
              title: item.name,
            }))}
          />
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <SectionHeader
            eyebrow="Blend Profiles"
            icon={<Sparkles size={18} />}
            title="当前混合风格卡"
          />
          <DataList
            empty="还没有混合风格卡。先选两张以上风格卡进行混合。"
            items={blendProfiles.map((item) => ({
              body: item.summary,
              meta: item.antiPatterns.join(" · "),
              title: item.name,
            }))}
          />
        </article>

        <article className="panel">
          <SectionHeader
            eyebrow="Continuous Learning"
            icon={<Radar size={18} />}
            title="持续学习怎么做"
          />
          <ol className="practice-list">
            <li>每次导入新小说，都让系统记录章节片段和风格卡。</li>
            <li>遇到新题材时，重新混合多张风格卡，而不是只追一位作者。</li>
            <li>写完章节后，把 review 结果转成新的 anti-AI 重点。</li>
            <li>保留你自己的成功章节，再反向导入，形成个人写作画像。</li>
          </ol>
        </article>
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Ledger"
          icon={<BookOpenText size={18} />}
          title="素材与队列"
        />
        <div className="two-column-ledger">
          <DataList
            empty="还没有参考素材。"
            items={references.map((item) => ({
              body: item.sourceLabel,
              meta: `${item.sourceType} · ${item.creatorLabel}`,
              title: item.title,
            }))}
          />
          <DataList
            empty="还没有任务。"
            items={jobs.map((item) => ({
              body: JSON.stringify(item.payload),
              meta: `${item.jobType} · ${item.status}`,
              title: `Project ${item.projectId}`,
            }))}
          />
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function SectionHeader({
  eyebrow,
  icon,
  title,
}: {
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <header className="section-header">
      <div className="section-title">
        <span>{icon}</span>
        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
    </header>
  );
}

function DataList({
  empty,
  items,
}: {
  empty: string;
  items: Array<{ body: string; meta: string; title: string }>;
}) {
  if (items.length === 0) {
    return <p className="empty-state">{empty}</p>;
  }

  return (
    <div className="list-stack">
      {items.map((item) => (
        <article className="list-card" key={`${item.title}-${item.meta}`}>
          <div className="list-head">
            <h3>{item.title}</h3>
            <span>{item.meta}</span>
          </div>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}
