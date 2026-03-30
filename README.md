# 围棋做题系统

一个独立的围棋做题应用，支持从CSV导入题目进行练习。

## 功能特性

- 📁 支持CSV文件导入题目
- 🎨 美观的围棋棋盘显示
- ✅ 选择题做题模式
- 📊 进度追踪和积分系统
- ❤️ 生命系统（最多5条命）
- 📝 自带示例数据

## CSV格式说明

CSV文件需要包含以下列：

| 列名 | 说明 | 示例 |
|------|------|------|
| sgf | 围棋棋谱SGF字符串 | `(;SZ[19]AB[pd][dd]AW[pp])` |
| type | 题目类型 | `TEXTCHOICE` |
| question | 题目描述 | `黑棋下一步应该走在哪里？` |
| options | 选项数组（JSON格式） | `["A位", "B位", "C位", "D位"]` |
| correctAnswer | 正确答案 | `A` 或 `0` |

### CSV示例

```csv
sgf,type,question,options,correctAnswer
"(;SZ[19]AB[pd][dd]AW[pp])",TEXTCHOICE,这是一道示例题,"[""A"",""B"",""C"",""D""]",A
"(;SZ[9]AB[aa][cc]AW[bb][dd])",TEXTCHOICE,9路棋盘题,"[""选我"",""不选我""]",0
```

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- @sabaki/go-board, @sabaki/sgf, @sabaki/shudan (围棋棋盘)
- PapaParse (CSV解析)
- Lucide React (图标)

## 项目结构

```
quiz-app/
├── public/
│   └── sample.csv          # 示例CSV文件
├── src/
│   ├── components/
│   │   ├── Goban.tsx       # 棋盘组件
│   │   ├── Header.tsx      # 顶部进度条
│   │   ├── Footer.tsx      # 底部按钮栏
│   │   ├── ResultCard.tsx  # 结果卡片
│   │   └── TextChoiceProblem.tsx  # 选择题组件
│   ├── lib/
│   │   ├── csvParser.ts    # CSV解析器
│   │   └── utils.ts        # 工具函数
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 入口文件
│   ├── types.ts            # 类型定义
│   ├── index.css           # 全局样式
│   └── theme.css           # 棋盘主题
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 使用说明

1. 启动应用后，可以选择：
   - 点击"加载示例数据"使用内置的示例题目
   - 上传自己的CSV文件

2. 做题流程：
   - 查看棋盘和题目
   - 点击选择答案
   - 点击"检查答案"按钮确认
   - 如果正确，点击"下一题"继续
   - 如果错误，可以点击"重试"或消耗一条生命

3. 完成所有题目后会显示完成页面，可以查看总积分和剩余生命。
