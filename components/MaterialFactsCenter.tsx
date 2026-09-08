'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SeriesProject } from '@/lib/series/types';
import type { MaterialFacts } from '@/lib/materialFacts';
import { currentMaterialFacts } from '@/lib/materialFacts';
import { materialRepairScope, projectMaterialQuestions } from '@/lib/series/materialRepair';

export default function MaterialFactsCenter({ project, locked, save, upload, pause }: {
  project: SeriesProject; locked: boolean;
  save: (objectId: string, facts: Partial<MaterialFacts>, revision: number) => Promise<void>;
  upload: (file: File) => Promise<string>;
  pause: () => Promise<SeriesProject>;
}) {
  const questions = useMemo(() => projectMaterialQuestions(project), [project]);
  const [objectId, setObjectId] = useState('');
  const [contents, setContents] = useState(''), [packaging, setPackaging] = useState(''), [usage, setUsage] = useState('');
  const [file, setFile] = useState<File>();
  const [error, setError] = useState(''), [saving, setSaving] = useState(false);
  const shown = useRef(new Set<string>());
  const revision = useRef(project.revision);
  const uploaded = useRef<{ file: File; url: string }>();
  const dismissalKey = (id: string) => `aid-material-deferred:${project.id}:${id}:${project.objects.find(o => o.id === id)?.imageUrl || ''}`;
  const opener = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const asset = project.objects.find(o => o.id === objectId);
  const scope = asset ? materialRepairScope(project, asset.id) : [];
  const open = (id: string) => {
    const object = project.objects.find(o => o.id === id);
    if (!object) return;
    const facts = currentMaterialFacts(object);
    revision.current = project.revision;
    setObjectId(id); setContents(facts?.contents || ''); setPackaging(facts?.packaging || ''); setUsage(facts?.usage || ''); setFile(undefined); setError('');
  };
  useEffect(() => {
    const question = questions.find(q => {
      const key = dismissalKey(q.objectId);
      if (shown.current.has(key)) return false;
      try { return localStorage.getItem(key) !== 'deferred'; } catch { return true; }
    });
    if (!objectId && question) {
      shown.current.add(dismissalKey(question.objectId));
      open(question.objectId);
    }
  }, [questions, project.id, objectId]); // Deferred questions remain available via the persistent entry.
  useEffect(() => { if (asset && !dialog.current?.open) dialog.current?.showModal(); }, [asset]);
  const close = () => { if (saving) return; try { localStorage.setItem(dismissalKey(objectId), 'deferred'); } catch {} dialog.current?.close(); setObjectId(''); opener.current?.focus(); };
  return <section className="my-4 rounded-xl border border-purple-400/40 p-4">
    <div className="flex items-center justify-between gap-3"><div><strong>素材事实与修复</strong><p className="mt-1 text-sm text-gray-400">{questions.length ? `有 ${questions.length} 处镜头缺少内含物信息，生成前会保留断点。` : '发现包装、材质或使用状态不对时，在这里补充一次。'}</p></div>
    <button ref={opener} type="button" className="rounded bg-purple-400 px-3 py-2 text-black" disabled={!project.objects.length} onClick={() => open(questions[0]?.objectId || project.objects[0].id)}>补充材料／纠正外观</button></div>
    {asset && <dialog ref={dialog} onCancel={event => { event.preventDefault(); close(); }} className="w-[min(92vw,640px)] rounded-xl border border-gray-600 bg-[#202124] p-6 text-white backdrop:bg-black/70" aria-labelledby="material-facts-title">
      <form onSubmit={async event => {
        event.preventDefault(); setSaving(true); setError('');
        try {
          if (file && uploaded.current?.file !== file) uploaded.current = { file, url: await upload(file) };
          const evidenceUrl = file ? uploaded.current?.url : currentMaterialFacts(asset)?.evidenceUrl;
          await save(asset.id, { contents, packaging, usage, evidenceUrl }, revision.current);
          dialog.current?.close(); setObjectId(''); opener.current?.focus();
        } catch (err) { setError(err instanceof Error ? err.message : '保存失败，填写内容已保留'); }
        finally { setSaving(false); }
      }}>
        <h2 id="material-facts-title" className="text-lg font-semibold">补充素材事实</h2>
        <label className="my-3 block">道具<select className="mt-1 w-full rounded bg-gray-800 p-2" value={asset.id} disabled={saving} onChange={event => open(event.target.value)}>{project.objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
        <p className="text-sm text-amber-200">{questions.find(q => q.objectId === asset.id)?.reason || '请填写实际外观，并说明原画面哪里有误。已确认事实会用于后续提示词。'}</p>
        {asset.imageUrl && <a href={asset.imageUrl} target="_blank" rel="noreferrer" className="my-2 block text-sm text-purple-300">查看原参考图</a>}
        {([['外包装外观', packaging, setPackaging], ['内含物／实际产品的颜色、材质（必填）', contents, setContents], ['使用状态与需要纠正的外观', usage, setUsage]] as const).map(([label, value, setter], i) => <label className="my-3 block text-sm" key={label}>{label}<textarea maxLength={2000} required={i === 1} disabled={saving} className="mt-1 w-full rounded bg-gray-800 p-2" value={value} onChange={event => setter(event.target.value)} /></label>)}
        <label className="block text-sm">补充照片（可选，填写事实即可保存；照片作为证据保留，不替换原包装图）<input type="file" accept="image/png,image/jpeg,image/webp" disabled={saving} className="my-2 block" onChange={event => setFile(event.target.files?.[0])} /></label>
        <p className="my-3 text-sm text-gray-300">修复范围：{scope.map(s => `第${s.episode}集 ${s.shots.join('、')}镜`).join('；') || '暂无引用镜头，仅保存商品事实'}。相关旧结果将归档，重写图片和视频提示词；共用视频片段或同一尾帧连续链的后续视频也需更新，其他分镜图与原台词保留。</p>
        {locked && <p className="text-amber-200">请先暂停制作队列，待当前任务保存断点后提交。填写内容会留在窗口中。<button type="button" className="ml-2 underline" disabled={saving} onClick={async () => { setSaving(true); try { const updated = await pause(); revision.current = updated.revision; } catch (err) { setError(err instanceof Error ? err.message : '暂停失败'); } finally { setSaving(false); } }}>暂停并保留断点</button></p>}
        {error && <p role="alert" className="my-2 text-red-300">{error}{revision.current !== project.revision && <button type="button" className="ml-2 underline" onClick={() => { revision.current = project.revision; setError('已采用窗口中最新列出的修复范围，请重新保存'); }}>按最新范围重新确认</button>}</p>}
        <div className="mt-4 flex justify-end gap-3"><button type="button" disabled={saving} onClick={close}>稍后处理</button><button type="submit" disabled={locked || saving || !contents.trim()} className="rounded bg-purple-400 px-4 py-2 text-black disabled:opacity-40">{saving ? '正在保存…' : '保存并标记相关镜头修复'}</button></div>
        <p className="mt-2 text-xs text-gray-400">保存后保持暂停，点击继续制作从断点修复，不会在提交表单时购买生成。</p>
      </form>
    </dialog>}
  </section>;
}
