'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, Trophy, BookOpen } from 'lucide-react'
import { ParsedQuestion, ProblemState, SuchengWeiqiSession } from './types'
import { parseCSV, generateSampleCSV } from './lib/csvParser'
import { playSound } from './lib/audio'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ResultCard } from './components/ResultCard'
import TextChoiceProblem from './components/TextChoiceProblem'
import { SuchengWeiqiBrowser } from './components/SuchengWeiqiBrowser'
import LifeDeathProblem from './components/LifeDeathProblem'

const MAX_HEARTS = 5

type ViewMode = 'home' | 'quiz' | 'suchengweiqi' | 'suchengweiqi-quiz'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home')

  // 普通做题模式状态
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | undefined>()
  const [status, setStatus] = useState<ProblemState>('pending')
  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [percentage, setPercentage] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [totalPoints, setTotalPoints] = useState(0)

  // 速成围棋套题模式状态
  const [suchengSession, setSuchengSession] = useState<SuchengWeiqiSession | null>(null)
  const [suchengCurrentIndex, setSuchengCurrentIndex] = useState(0)
  const [suchengStatus, setSuchengStatus] = useState<ProblemState>('pending')
  const [suchengHearts, setSuchengHearts] = useState(MAX_HEARTS)
  const [suchengPercentage, setSuchengPercentage] = useState(0)
  const [suchengIsCompleted, setSuchengIsCompleted] = useState(false)
  const [suchengTotalPoints, setSuchengTotalPoints] = useState(0)

  const currentQuestion = questions[currentIndex]
  const currentSuchengQuestion = suchengSession?.questions[suchengCurrentIndex]

  // 普通做题模式函数
  const loadSampleData = useCallback(() => {
    try {
      const csvContent = generateSampleCSV()
      const parsed = parseCSV(csvContent)
      setQuestions(parsed)
      setViewMode('quiz')
      resetQuiz()
    } catch (error) {
      console.error('加载示例数据失败:', error)
      alert('加载示例数据失败')
    }
  }, [])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string
        const parsed = parseCSV(csvContent)
        setQuestions(parsed)
        setViewMode('quiz')
        resetQuiz()
      } catch (error) {
        console.error('解析CSV失败:', error)
        alert('解析CSV失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
  }, [])

  const resetQuiz = () => {
    setCurrentIndex(0)
    setSelectedOption(undefined)
    setStatus('pending')
    setHearts(MAX_HEARTS)
    setPercentage(0)
    setIsCompleted(false)
    setTotalPoints(0)
  }

  // 计算套题生命值：最低5，题目数/2向上取整，最大10
  const calculateSuchengHearts = (questionCount: number): number => {
    const hearts = Math.ceil(questionCount / 2)
    return Math.min(Math.max(hearts, 5), 10)
  }

  const resetSuchengQuiz = () => {
    setSuchengCurrentIndex(0)
    setSuchengStatus('pending')
    if (suchengSession) {
      setSuchengHearts(calculateSuchengHearts(suchengSession.questions.length))
    } else {
      setSuchengHearts(MAX_HEARTS)
    }
    setSuchengPercentage(0)
    setSuchengIsCompleted(false)
    setSuchengTotalPoints(0)
  }

  const exitToHome = () => {
    setQuestions([])
    setSuchengSession(null)
    setViewMode('home')
    resetQuiz()
    resetSuchengQuiz()
  }

  const enterSuchengWeiqi = () => {
    setViewMode('suchengweiqi')
  }

  const handleSelectSuchengSession = (session: SuchengWeiqiSession) => {
    setSuchengSession(session)
    setViewMode('suchengweiqi-quiz')
    setSuchengCurrentIndex(0)
    setSuchengStatus('pending')
    setSuchengHearts(calculateSuchengHearts(session.questions.length))
    setSuchengPercentage(0)
    setSuchengIsCompleted(false)
    setSuchengTotalPoints(0)
  }

  // 普通做题模式 - 下一题
  const onNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => current + 1)
      setSelectedOption(undefined)
      setStatus('pending')
    } else {
      setIsCompleted(true)
      playSound('finish')
    }
  }

  // 速成围棋套题 - 下一题
  const onSuchengNext = () => {
    if (suchengSession && suchengCurrentIndex < suchengSession.questions.length - 1) {
      setSuchengCurrentIndex((current) => current + 1)
      setSuchengStatus('pending')
    } else {
      setSuchengIsCompleted(true)
      playSound('finish')
    }
  }

  const onSelect = (id: number) => {
    setSelectedOption(id)
  }

  const onContinue = () => {
    if (selectedOption === undefined || !currentQuestion) return

    const correctOption = currentQuestion.options.find((opt) => opt.correct)
    if (!correctOption) return

    if (selectedOption === correctOption.id) {
      setStatus('correct')
      setTotalPoints((prev) => prev + 10)
      setPercentage((prev) => prev + 100 / questions.length)
      playSound('correct')
    } else {
      setStatus('error')
      setHearts((prev) => Math.max(prev - 1, 0))
      playSound('incorrect')
    }
  }

  const handleSuchengStateChange = (state: ProblemState) => {
    setSuchengStatus(state)
    if (state === 'correct') {
      setSuchengTotalPoints((prev) => prev + 10)
      if (suchengSession) {
        setSuchengPercentage((prev) => prev + 100 / suchengSession.questions.length)
      }
      playSound('correct')
    } else if (state === 'error') {
      setSuchengHearts((prev) => Math.max(prev - 1, 0))
      playSound('incorrect')
    }
  }

  const handleRetry = () => {
    setSelectedOption(undefined)
    setStatus('pending')
  }

  const handleFooterCheck = () => {
    if (status === 'pending') {
      onContinue()
    } else if (status === 'error') {
      handleRetry()
    } else if (status === 'correct') {
      onNext()
    }
  }

  const handleSuchengFooterCheck = () => {
    if (suchengStatus === 'pending') {
      // 死活题模式下 pending 状态不需要操作，用户在棋盘上落子
    } else if (suchengStatus === 'error') {
      // 错误时重置
      setSuchengStatus('pending')
    } else if (suchengStatus === 'correct') {
      onSuchengNext()
    }
  }

  // 速成围棋套题模式 - 题目列表
  if (viewMode === 'suchengweiqi') {
    return (
      <SuchengWeiqiBrowser
        onBack={exitToHome}
        onSelectSession={handleSelectSuchengSession}
      />
    )
  }

  // 速成围棋套题做题模式 - 完成页面
  if (viewMode === 'suchengweiqi-quiz' && suchengIsCompleted && suchengSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">恭喜完成！</h1>
          <p className="text-gray-600 mb-2">{suchengSession.title}</p>
          <p className="text-gray-500 mb-8">你已完成所有题目</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <ResultCard variant="points" value={suchengTotalPoints} label="总积分" />
            <ResultCard variant="hearts" value={suchengHearts} label="剩余生命" />
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={resetSuchengQuiz}
              className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors border-b-4 border-green-600 active:border-b-0"
            >
              重新开始
            </button>
            <button
              onClick={() => setViewMode('suchengweiqi')}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors border-b-4 border-amber-600 active:border-b-0"
            >
              选择题库
            </button>
            <button
              onClick={exitToHome}
              className="px-6 py-3 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors border-b-4 border-gray-600 active:border-b-0"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 速成围棋套题做题模式 - 做题页面
  if (viewMode === 'suchengweiqi-quiz' && suchengSession && currentSuchengQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32">
        <Header
          hearts={suchengHearts}
          percentage={suchengPercentage}
          onExit={exitToHome}
        />

        <div className="mx-auto max-w-4xl px-4 pt-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 mb-1">{suchengSession.title}</p>
            <span className="text-sm text-gray-500">
              第 {suchengCurrentIndex + 1} / {suchengSession.questions.length} 题
            </span>
          </div>

          <LifeDeathProblem
            initSgf={currentSuchengQuestion.sgfContent}
            onStateChange={handleSuchengStateChange}
          />
        </div>

        <Footer
          onCheck={handleSuchengFooterCheck}
          status={suchengStatus}
          disabled={suchengStatus === 'pending'}
        />
      </div>
    )
  }

  if (viewMode === 'home' || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">围棋做题系统</h1>
            <p className="text-gray-600">选择题库或上传CSV文件开始做题</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={enterSuchengWeiqi}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors border-b-4 border-amber-600 active:border-b-0"
            >
              <BookOpen className="w-5 h-5" />
              速成围棋题库
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">或者</span>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-1 text-sm text-gray-500">
                  <span className="font-semibold">点击上传CSV文件</span> 或拖拽到此处
                </p>
                <p className="text-xs text-gray-400">支持 .csv 格式</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </label>

            <button
              onClick={loadSampleData}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors border-b-4 border-green-600 active:border-b-0"
            >
              <FileText className="w-5 h-5" />
              加载示例数据
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-bold text-gray-700 mb-2">CSV格式说明：</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <code>sgf</code>: 围棋棋谱SGF字符串</li>
              <li>• <code>type</code>: 题目类型 (如 TEXTCHOICE)</li>
              <li>• <code>question</code>: 题目描述</li>
              <li>• <code>options</code>: 选项数组JSON，如 ["A","B","C"]</li>
              <li>• <code>correctAnswer</code>: 正确答案 (A, B, C... 或 0, 1, 2...)</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">恭喜完成！</h1>
          <p className="text-gray-600 mb-8">你已完成所有题目</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <ResultCard variant="points" value={totalPoints} label="总积分" />
            <ResultCard variant="hearts" value={hearts} label="剩余生命" />
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={resetQuiz}
              className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors border-b-4 border-green-600 active:border-b-0"
            >
              重新开始
            </button>
            <button
              onClick={exitToHome}
              className="px-6 py-3 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors border-b-4 border-gray-600 active:border-b-0"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32">
      <Header
        hearts={hearts}
        percentage={percentage}
        onExit={exitToHome}
      />

      <div className="mx-auto max-w-4xl px-4 pt-6">
        <div className="text-center mb-4">
          <span className="text-sm text-gray-500">
            第 {currentIndex + 1} / {questions.length} 题
          </span>
        </div>

        <TextChoiceProblem
          initSgf={currentQuestion.sgf}
          question={currentQuestion.question}
          options={currentQuestion.options}
          solveState={status}
          onSelect={onSelect}
        />
      </div>

      <Footer
        onCheck={handleFooterCheck}
        status={status}
        disabled={status === 'pending' && selectedOption === undefined}
      />
    </div>
  )
}

export default App
