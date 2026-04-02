<div align="center">
  <h1>Vidraw</h1>
  <p><strong>开源白板，支持录制与摄像头显示</strong></p>
  <p>Open source whiteboard with recording & camera display</p>
</div>

<br />

<div align="center">
  <h2>
    ✨ 手绘风格白板 + 🎥 屏幕录制 + 📹 摄像头显示
  </h2>
</div>

<br />

<p align="center">
  <a href="https://github.com/secneo/vidraw/blob/master/LICENSE">
    <img alt="MIT license" src="https://img.shields.io/badge/license-MIT-blue.svg"  /></a>
  <a href="https://github.com/secneo/vidraw">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/secneo/vidraw?style=social"  /></a>
</p>

---

## 功能特性

Vidraw 基于 Excalidraw 构建，新增以下特色功能：

### 🎥 屏幕录制

- **区域选择**：自由选择录制区域，支持拖拽调整大小和位置
- **宽高比预设**：支持 9:16、3:4、1:1、4:3、16:9 等常用比例
- **分辨率选择**：480p、720p、1080p、2K、4K 多种分辨率
- **麦克风录音**：支持麦克风音频录制
- **高清输出**：自动 MP4 格式转换，高比特率保证画质

### 📹 摄像头显示

- 画布上实时显示摄像头画面
- 可调整摄像头窗口位置和大小

### ✍️ 白板功能

- 💯&nbsp;免费开源
- 🎨&nbsp;无限画布
- ✍️&nbsp;手绘风格
- 🌓&nbsp;深色模式
- 📷&nbsp;图片支持
- 🖼️&nbsp;导出 PNG、SVG
- 💾&nbsp;本地自动保存
- ⚒️&nbsp;丰富的绘图工具

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- Yarn >= 1.22.0

### 安装依赖

```bash
yarn install
```

### 启动开发服务器

```bash
yarn start
```

### 构建生产版本

```bash
yarn build
```

## 使用说明

### 录制视频

1. 点击工具栏中的录制按钮
2. 选择录制区域
3. 选择宽高比和分辨率
4. 点击"开始录制"
5. 选择要共享的屏幕/窗口/标签页
6. 录制完成后点击停止按钮
7. 选择保存位置

### 摄像头功能

1. 点击摄像头按钮开启
2. 拖拽调整摄像头窗口位置
3. 录制时摄像头画面会被同步录制

## 技术栈

- React 19
- TypeScript
- Vite
- MediaRecorder API
- FFmpeg.wasm

## 项目结构

```
vidraw/
├── packages/
│   ├── vidraw/          # 核心白板组件
│   ├── common/          # 公共工具
│   ├── element/         # 元素逻辑
│   ├── math/            # 数学计算
│   └── utils/           # 工具函数
├── vidraw-app/          # Web 应用
└── examples/            # 示例项目
```

## 致谢

本项目基于 [Excalidraw](https://github.com/excalidraw/excalidraw) 开发，感谢原作者的优秀工作。

## License

MIT License



## 📞 联系方式

- **GitHub**: https://github.com/taxiao213/Vidraw
- **微信公众号**: 他晓

------

<div align="center">
**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

Made with ❤️ by 他晓

</div>
