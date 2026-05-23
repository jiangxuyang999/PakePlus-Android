# 地图素材

## 豆包生图 → 去底 → 嵌入 工作流

### 1. 豆包生成
- 提示词模板：`游戏素材，等距俯视45度视角。[建筑描述]。吉卜力动画场景风格，干净轮廓柔和光影。纯白背景，无文字无人物，PNG 1024px宽。`
- 保存到 `assets/image.png`

### 2. 去背景
```bash
python -c "
from rembg import remove
from PIL import Image
img = Image.open('assets/image.png')
out = remove(img)
out.save('www/assets/xxx.png', 'PNG')
"
```

### 3. 嵌入地图（在 app.js renderMap SVG 中）
```xml
<image href="/assets/xxx.png" x="X" y="Y" width="W" height="H"/>
```

### 已有素材
| 文件 | 建筑 | 位置 |
|------|------|------|
| old_house.png | 语嫣家·老洋房 | X=48 Y=772 (南岸) |
