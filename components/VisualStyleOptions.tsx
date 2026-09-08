import { FEATURED_PRODUCTION_STYLES, OTHER_PRODUCTION_STYLES } from '@/lib/promptArchitecture';

export default function VisualStyleOptions() {
  return <>
    <optgroup label="拍摄与动画风格">
      {FEATURED_PRODUCTION_STYLES.map(style => <option key={style.value} value={style.value}>{style.label} · {style.description}</option>)}
    </optgroup>
    <optgroup label="更多风格">
      {OTHER_PRODUCTION_STYLES.map(style => <option key={style.value} value={style.value}>{style.label} · {style.description}</option>)}
    </optgroup>
  </>;
}
