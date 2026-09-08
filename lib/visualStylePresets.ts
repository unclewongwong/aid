import type { VisualStyle } from '@/types';
import type { ProductionStylePreset } from './promptArchitecture';

export const FEATURED_VISUAL_STYLES: VisualStyle[] = ['film', 'iphone', 'variety', 'guoman', 'chibi', 'documentary', 'commercial'];
export const ANIMATED_VISUAL_STYLES: VisualStyle[] = ['anime', '3d-cg', 'stop-motion', 'guoman', 'chibi'];

function preset(value: VisualStyle, label: string, description: string, image: string, camera: string, performance: string): ProductionStylePreset {
  return {
    value, label, description, imageContract: image, gridImageDirection: image,
    look: image, camera, performance,
    rhythm: 'Cut on the authored action, discovery or reaction. Preserve the story beat and natural timing; no default slow motion.',
    sound: 'Preserve the authored dialogue and voice identity. Use location-appropriate room tone and visibly motivated Foley; no invented voices or music.',
    h3Direction: `${camera} ${performance} Preserve the reference style and the authored dialogue, action and camera path.`,
  };
}

/** Camera, light and character design are explicit, rather than color-filter names. */
export const ADDITIONAL_STYLE_PRESETS: ProductionStylePreset[] = [
  preset('film', '电影胶片', '胶片颗粒、柔和高光与有层次的电影布光',
    'A photographed frame from a film shot on 35mm motion-picture stock with a coherent spherical lens. Fine irregular grain, gentle highlight roll-off, truthful facial texture and tactile cloth. Motivated practical light and soft bounced fill, intentional layered composition and an unforced mid-action gesture. Keep the speaking face and required action clearly resolved. Color follows the authored location and time of day; do not force amber light, haze, broad flare or a vintage filter.',
    'A physical cinema camera with a coherent spherical lens; planned framing and restrained movement follow the authored blocking.',
    'Restrained, character-driven performance with natural body weight, meaningful eyelines and real-time gestures.'),
  preset('iphone', 'iPhone 拍摄', '日常手机视角、自然光与随手抓拍感',
    'An ordinary unfiltered photograph taken with the main 1x camera of an iPhone. Believable close wide-angle perspective and broad depth of field, casual slightly imperfect framing, everyday cloth creases, stray hairs and normal skin without beauty smoothing. Available location light with plausible automatic exposure and white balance; use phone flash only when the scene or user calls for it. Keep faces readable, without portrait-mode blur or cinematic rim lighting.',
    'A handheld phone at an ordinary human height follows the authored action with small plausible corrections and broad depth of field.',
    'People stay occupied by the scene, caught mid-conversation or action rather than posing for a photograph.'),
  preset('variety', '综艺节目', '多人表情清楚、自然肤色与现场互动',
    'A clean photographed frame from a location-based Chinese travel reality TV show, recorded by a shoulder-mounted broadcast camera at eye level with a moderate zoom lens. Broad soft fill makes every participant’s expression readable while preserving the authored time of day and actual location. Balanced natural skin color, bright readable midtones, moderate depth of field and clear cloth texture. An unscripted-looking group interaction with differing eyelines and reactions. No beauty smoothing, cinematic haze, decorative flare or broadcast captions.',
    'A broadcast camera preserves group geography and follows the authored action or reaction; keep the relevant participants readable without imposing a distant news-telephoto viewpoint.',
    'Natural conversational timing, small individual reactions and comfortable body weight; nobody poses or addresses the lens unless the script requests it.'),
  preset('guoman', 'CG动画（国漫）', '成人比例角色、精细毛发与国漫式 CG 造型',
    'A frame from a high-end Chinese 3D animated production. Designed CG faces with restrained anime-inspired facial planes and expressive sculpted eyes, carefully groomed hair clumps, detailed simulated cloth and a stylized physically based environment. Preserve the specified age, species, recognizable identity and wardrobe with natural body proportions. Unified animation lighting, readable silhouettes and expressive acting poses. Clearly an animated character design rather than live-action photography.',
    'A coherent virtual camera with motivated perspective, stable character scale and deliberate composition.',
    'Readable animated acting with restrained stylization, expressive eyes and believable weight; retain the character model throughout movement.'),
  preset('chibi', '3D Q版卡通', '大头小身体、圆润材质与夸张表情',
    'A crafted 3D chibi cartoon frame. Reinterpret the referenced cast with large heads, compact bodies, simplified expressive features and rounded hands while retaining recognizable identity, specified age, species, hairstyle, wardrobe colors and signature accessories. Soft matte materials, rounded shapes, a miniature stage-like environment and broad soft light. Clearly stylized caricatures, not real people or realistic skin. Keep important props recognizable and the authored action readable.',
    'A coherent miniature-scale virtual camera with readable silhouettes, stable proportions and uncluttered action framing.',
    'Exaggerated but clear pose changes and facial reactions, purposeful timing and consistent large-head compact-body proportions.'),
];
