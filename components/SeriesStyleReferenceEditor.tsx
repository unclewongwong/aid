'use client';
import {useState} from 'react';
import type {VisualStyle} from '@/types';
import VisualStyleOptions from './VisualStyleOptions';
import type {ImageStyleReference} from '@/lib/imageStyleReference';

export default function SeriesStyleReferenceEditor({style,visualStyle,disabled,onSave}:{style?:ImageStyleReference;visualStyle:VisualStyle;disabled:boolean;onSave:(file:File|undefined,description:string,remove?:boolean,visualStyle?:VisualStyle)=>Promise<boolean>}) {
  const [selectedStyle,setSelectedStyle]=useState(visualStyle);
  const [file,setFile]=useState<File>();
  const [description,setDescription]=useState(style?.description||'');
  return <section className="mb-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5" aria-label="全系列风格参考">
    <h3 className="text-sm font-medium">全剧视觉风格</h3>
    <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">选择电影胶片、iPhone、综艺或动画等风格，统一全剧的拍摄与造型方式。也可上传参考图补充色彩和光影；保留人物身份、服装与剧本动作。</p>
    <label className="mt-4 block text-xs">全剧视觉风格<select aria-label="全剧视觉风格" value={selectedStyle} onChange={event=>setSelectedStyle(event.target.value as VisualStyle)} disabled={disabled} className="mt-2 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-sm"><VisualStyleOptions/></select></label>
    <div className="mt-4 flex flex-wrap items-start gap-4">
      {style && <img src={style.imageUrl} alt="当前全系列风格标准" className="h-36 w-36 rounded-lg object-cover"/>}
      <div className="min-w-60 flex-1 space-y-3">
        <label className="block text-xs">上传风格参考图<input className="mt-2 block w-full text-xs" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled} onChange={e=>setFile(e.target.files?.[0])}/></label>
        <label className="block text-xs">风格说明（可选）<textarea className="mt-2 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-sm" rows={3} maxLength={1600} value={description} onChange={e=>setDescription(e.target.value)} disabled={disabled} placeholder="例如：超强真实感，像真实电影现场拍到的一瞬间。自然肤质和光线，保留抓拍感，不磨皮、不刻意摆拍。沿用参考图的色温、色调和文化气质。"/></label>
        <p className="text-xs leading-5 text-[var(--text-secondary)]">用直观短句描述想要的效果即可，例如“超强真实感”“自然抓拍感”。无需堆叠 CG、材质或渲染术语；说明会随风格参考传入生成提示词。</p>
        <p className="text-xs leading-5 text-amber-200/80">更换风格会归档旧视觉素材并标记整剧重新制作，剧本、声音和历史成片保留。当前任务需先暂停并保存断点。</p>
        <div className="flex gap-3">
          <button type="button" className="rounded-lg bg-[#a78bfa] px-3 py-2 text-xs text-[#1d1534] disabled:opacity-40" disabled={disabled||(!file&&!style&&selectedStyle===visualStyle)} onClick={()=>void onSave(file,description,false,selectedStyle).then(saved=>{if(saved)setFile(undefined);})}>保存全剧风格</button>
          {style && <button type="button" className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs disabled:opacity-40" disabled={disabled} onClick={()=>void onSave(undefined,'',true,selectedStyle)}>移除风格参考</button>}
        </div>
      </div>
    </div>
  </section>;
}
