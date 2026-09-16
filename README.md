# Controllable Heroine / 可控女主演示

Minimal **Vite + Three.js** demo: a free East Asian female avatar with `window.hero.act(...)` actions, on-page buttons, and pastel studio lighting.

最小 **Vite + Three.js** 演示：免费东亚女性形象，提供 `window.hero.act(...)` API、页面按钮，以及粉彩棚拍背景。

## Model / 模型

- **URL**: `https://cdn.jsdelivr.net/gh/c-frame/valid-avatars-glb@c539a28/avatars/Asian/Asian_F_1_Casual.glb`
- Source: [VALID avatars (GLB)](https://github.com/c-frame/valid-avatars-glb) via jsDelivr CDN (no auth).
- Young East Asian female, casual outfit, Mixamo-style skeleton.
- **Outfit gap**: not cream/white top + denim skirt — VALID casual clothing is the closest free public match.

- 来源：VALID 角色库经 jsDelivr 托管，无需鉴权。
- 年轻东亚女性、休闲装、Mixamo 风格骨骼。
- **服装差异**：并非奶油白上衣 + 牛仔裙；在免费公开资源中，这是最接近的可用形象。

## Run / 运行

```bash
npm install
npm run dev
```

Build / 构建:

```bash
npm run build
npm run preview
```

Open the local URL Vite prints (usually `http://localhost:5173`).

打开 Vite 打印的本地地址（通常为 `http://localhost:5173`）。

## JS API

```js
window.hero.act('idle');   // loop
window.hero.act('wave');   // once -> idle
window.hero.act('peace');  // once -> idle
window.hero.act('sneeze'); // once -> idle (approximated / 近似)
```

On-page buttons call the same API. 页面按钮调用同一 API。

## Animations / 动画

Playback uses **Three.js `AnimationMixer`** with **procedural `AnimationClip`s** keyed on Mixamo-style bones (`RightArm`, `Head`, `Spine`, ...). The GLB has a skeleton but **no embedded clips**; Mixamo FBX retarget was skipped for the shortest free path.

- `idle` / `wave` / `peace`: procedural bone poses
- `sneeze`: **approximated** (button label `Sneeze ≈`) — inhale lean + forward burst

使用 **`AnimationMixer`** + 程序化骨骼动画。`sneeze` 为**近似动作**。

## Visual / 视觉

- Pastel **cyan → lavender → pink** page gradient + soft lights
- Simple circular studio floor + translucent ring

- 粉彩青→紫→粉渐变背景 + 柔和棚灯
- 圆形地面与半透明光环

## Limitations / 限制

1. Likeness & outfit are free-asset approximations, not a custom lookalike scan.
2. Peace sign is wrist/hand tilted, not a true V finger morph.
3. Requires network access to jsDelivr for the GLB at runtime.
4. Ready Player Me public CDN was discontinued (2026); VALID Asian female casual is the substitute.

1. 形象与服装为免费资源近似，非定制扫描。
2. “比耶”主要为手腕姿态近似。
3. 运行时需访问 jsDelivr 加载 GLB。
4. Ready Player Me 公共 CDN 已停用；改用 VALID。

## License notes / 许可说明

Demo code: use freely in this repo. Avatar: follow VALID / upstream licensing. Three.js: MIT.

演示代码可自由用于本仓库。角色请遵循 VALID / 上游许可。Three.js：MIT。
