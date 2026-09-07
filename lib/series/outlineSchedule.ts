/** Episode indices are production metadata. Source prose never sets the count. */
export function normalizeSingleEpisodeOutline(raw: any, episodeCount: number): any {
  if (episodeCount !== 1 || !raw?.bible) return raw;
  const { arcs, promises } = raw.bible;
  // Missing story content still goes through ordinary validation/repair. Do
  // not invent a goal, discard a phase, or replace the retained source draft.
  const canMerge = Array.isArray(arcs) && arcs.length > 0 && arcs.every(a =>
    typeof a?.goal === 'string' && a.goal.trim() && typeof a?.reversal === 'string' && a.reversal.trim());
  return {
    ...raw,
    bible: {
      ...raw.bible,
      arcs: canMerge ? [{
        start: 1, end: 1,
        goal: arcs.map(a => a.goal).join('\n'),
        reversal: arcs.map(a => a.reversal).join('\n'),
      }] : arcs,
      promises: Array.isArray(promises)
        ? promises.map(p => ({ ...p, plantedIn: 1, payoffIn: 1 })) : promises,
    },
  };
}

export function outlineEpisodeContract(episodeCount: number): string {
  return `集数的唯一权威是界面设置：episodeCount=${episodeCount}。用户正文、标题、章号、镜头号、年龄、年份、价格及模型输出都不得改变集数。arcs.start/end 与 promises.plantedIn/payoffIn 全部是集号，不是镜号；必须为1–${episodeCount}内的整数。阶段按顺序从第1集连续覆盖至第${episodeCount}集，不重叠、不留空。${episodeCount === 1 ? '本项目只有1集：arcs只返回一项start=1,end=1，将所有故事阶段的目标和转折按先后纳入该项；每条伏笔都必须plantedIn=1,payoffIn=1。完整保留故事的因果、转折和结局，不扩写为多集。' : `全季恰好${episodeCount}集，保持故事因果顺序并按设定集数组织；不可根据原稿自行增减集数。`}`;
}
