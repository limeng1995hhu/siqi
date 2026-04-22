'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, Printer, RefreshCw } from 'lucide-react'
import Sgf from '@sabaki/sgf'
import Board from '@sabaki/go-board'
import { PrintGoban } from './PrintGoban'
import type { SuchengWeiqiQuestion } from '../types'
import { loadSuchengWeiqiData } from '../lib/suchengweiqiParser'

interface PrintQuestion {
  question: SuchengWeiqiQuestion
  index: number
  rangeX: [number, number]
  rangeY: [number, number]
  boardSize: number
  boardState: (0 | 1 | -1)[][]
  markerMap: (any | null)[][]
  stem: string
}

// 从 SGF 中提取棋子和标记
const extractBoardFromSgf = (sgfContent: string) => {
  try {
    const gameTree = Sgf.parse(sgfContent)
    const rootNode = gameTree[0]
    const rootData = rootNode.data

    const SZ = Number(rootData['SZ']?.[0]) || 19

    const createEmptyBoard = (size: number) =>
      Array(size).fill(null).map(() => Array(size).fill(0)) as (0 | 1 | -1)[][]

    let board = new Board(createEmptyBoard(SZ))

    // 处理根节点的 AB/AW
    if (rootData['AB']) {
      const AB = Array.isArray(rootData['AB']) ? rootData['AB'] : [rootData['AB']]
      AB.forEach((coord: string) => {
        const x = coord.charCodeAt(0) - 97
        const y = coord.charCodeAt(1) - 97
        if (x >= 0 && y >= 0 && x < SZ && y < SZ) {
          board = board.makeMove(1, [x, y])
        }
      })
    }

    if (rootData['AW']) {
      const AW = Array.isArray(rootData['AW']) ? rootData['AW'] : [rootData['AW']]
      AW.forEach((coord: string) => {
        const x = coord.charCodeAt(0) - 97
        const y = coord.charCodeAt(1) - 97
        if (x >= 0 && y >= 0 && x < SZ && y < SZ) {
          board = board.makeMove(-1, [x, y])
        }
      })
    }

    // 处理标记
    const markerMap = Array(SZ).fill(null).map(() => Array(SZ).fill(null))
    if (rootData['LB']) {
      const LB = Array.isArray(rootData['LB']) ? rootData['LB'] : [rootData['LB']]
      LB.forEach((label: string) => {
        const [coord, text] = label.split(':')
        const x = coord.charCodeAt(0) - 97
        const y = coord.charCodeAt(1) - 97
        if (x >= 0 && y >= 0 && x < SZ && y < SZ) {
          markerMap[y][x] = { type: 'label', label: text }
        }
      })
    }

    // 提取题干（从 C 属性）
    let stem = rootData['C']?.[0] || ''
    stem = stem.replace(/\s+/g, ' ').trim()
    if (!stem) {
      stem = rootData['N']?.[0] || ''
    }

    return {
      boardState: board.signMap as (0 | 1 | -1)[][],
      markerMap,
      boardSize: SZ,
      stem
    }
  } catch (e) {
    console.error('SGF解析错误:', e)
    const SZ = 19
    return {
      boardState: Array(SZ).fill(null).map(() => Array(SZ).fill(0)) as (0 | 1 | -1)[][],
      markerMap: Array(SZ).fill(null).map(() => Array(SZ).fill(null)),
      boardSize: SZ,
      stem: ''
    }
  }
}

// 计算部分棋盘范围：所有棋子 + 至少一个角点
const calculatePartialRange = (boardState: (0 | 1 | -1)[][], boardSize: number): [number, number][] => {
  const occupiedCoords: [number, number][] = []

  // 找出所有有棋子的位置
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (boardState[y][x] !== 0) {
        occupiedCoords.push([x, y])
      }
    }
  }

  if (occupiedCoords.length === 0) {
    // 没有棋子，默认显示左上角
    return [[0, 9], [0, 9]]
  }

  // 找出棋子的边界
  let minX = boardSize, maxX = -1, minY = boardSize, maxY = -1
  occupiedCoords.forEach(([x, y]) => {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  })

  // 计算需要的最小范围（至少包含一个角点）
  // 四个角点
  const corners = [
    { x: 0, y: 0 },
    { x: 0, y: boardSize - 1 },
    { x: boardSize - 1, y: 0 },
    { x: boardSize - 1, y: boardSize - 1 }
  ]

  // 找到最近的角点
  let nearestCorner = corners[0]
  let minDist = Infinity

  corners.forEach(corner => {
    const dist = Math.max(
      Math.abs(corner.x - minX),
      Math.abs(corner.x - maxX),
      Math.abs(corner.y - minY),
      Math.abs(corner.y - maxY)
    )
    if (dist < minDist) {
      minDist = dist
      nearestCorner = corner
    }
  })

  // 根据最近的角点，确定显示范围
  let rangeX: [number, number]
  let rangeY: [number, number]

  if (nearestCorner.x === 0 && nearestCorner.y === 0) {
    // 左上角
    rangeX = [0, Math.max(maxX, 8)]
    rangeY = [0, Math.max(maxY, 8)]
  } else if (nearestCorner.x === boardSize - 1 && nearestCorner.y === 0) {
    // 右上角
    rangeX = [Math.min(minX, boardSize - 9), boardSize - 1]
    rangeY = [0, Math.max(maxY, 8)]
  } else if (nearestCorner.x === 0 && nearestCorner.y === boardSize - 1) {
    // 左下角
    rangeX = [0, Math.max(maxX, 8)]
    rangeY = [Math.min(minY, boardSize - 9), boardSize - 1]
  } else {
    // 右下角
    rangeX = [Math.min(minX, boardSize - 9), boardSize - 1]
    rangeY = [Math.min(minY, boardSize - 9), boardSize - 1]
  }

  // 确保范围至少是9x9
  const width = rangeX[1] - rangeX[0] + 1
  const height = rangeY[1] - rangeY[0] + 1

  if (width < 9) {
    if (rangeX[0] === 0) {
      rangeX[1] = Math.min(rangeX[0] + 8, boardSize - 1)
    } else {
      rangeX[0] = Math.max(rangeX[1] - 8, 0)
    }
  }

  if (height < 9) {
    if (rangeY[0] === 0) {
      rangeY[1] = Math.min(rangeY[0] + 8, boardSize - 1)
    } else {
      rangeY[0] = Math.max(rangeY[1] - 8, 0)
    }
  }

  return [rangeX, rangeY]
}

interface PrintPreviewProps {
  onBack: () => void
}

export const PrintPreview = ({ onBack }: PrintPreviewProps) => {
  const [loading, setLoading] = useState(true)
  const [allQuestions, setAllQuestions] = useState<SuchengWeiqiQuestion[]>([])
  const [printQuestions, setPrintQuestions] = useState<PrintQuestion[]>([])

  // 加载题目数据并随机抽取10道
  useEffect(() => {
    const loadAndRandomize = async () => {
      try {
        const questions = await loadSuchengWeiqiData()

        // 随机抽取10道题目
        const shuffled = [...questions].sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, 10)

        // 处理每道题目，计算棋盘范围
        const processed = selected.map((q, index) => {
          const { boardState, markerMap, boardSize, stem } = extractBoardFromSgf(q.sgfContent)
          const [rangeX, rangeY] = calculatePartialRange(boardState, boardSize)

          return {
            question: q,
            index,
            rangeX,
            rangeY,
            boardSize,
            boardState,
            markerMap,
            stem
          }
        })

        setAllQuestions(questions)
        setPrintQuestions(processed)
      } catch (err) {
        console.error('加载题目失败:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAndRandomize()
  }, [])

  // 重新随机抽取题目
  const handleReroll = () => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, 10)

    const processed = selected.map((q, index) => {
      const { boardState, markerMap, boardSize, stem } = extractBoardFromSgf(q.sgfContent)
      const [rangeX, rangeY] = calculatePartialRange(boardState, boardSize)

      return {
        question: q,
        index,
        rangeX,
        rangeY,
        boardSize,
        boardState,
        markerMap,
        stem
      }
    })

    setPrintQuestions(processed)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载题目中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-8">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">打印题目</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReroll}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重新抽取
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg font-bold cursor-not-allowed"
                title="打印功能开发中"
              >
                <Printer className="w-4 h-4" />
                打印题目
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 题目列表 - 一行3个，每页4行 */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* 分成每行3个，共4行（最后一行1个） */}
        {Array.from({ length: Math.ceil(printQuestions.length / 3) }).map((_, rowIdx) => {
          const rowQuestions = printQuestions.slice(rowIdx * 3, rowIdx * 3 + 3)
          return (
            <div
              key={rowIdx}
              className="grid grid-cols-3 gap-4 mb-4 print-row"
            >
              {rowQuestions.map((pq, colIdx) => {
                const globalIdx = rowIdx * 3 + colIdx
                return (
                  <div
                    key={globalIdx}
                    className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center print-question-card"
                  >
                    <div className="text-sm font-bold text-gray-700 mb-2">
                      {globalIdx + 1}.
                    </div>

                    {/* 部分棋盘展示 - 使用打印专用组件，无坐标 */}
                    <PrintGoban
                      signMap={pq.boardState}
                      markerMap={pq.markerMap}
                      rangeX={pq.rangeX}
                      rangeY={pq.rangeY}
                      showCoordinates={false}
                      boardSize={pq.boardSize}
                    />

                    {/* 题干展示在棋盘底部 */}
                    <div className="mt-2 text-xs text-gray-600 text-center min-h-[2.5em] leading-tight">
                      {pq.stem || `第 ${pq.question.questionNo} 题`}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PrintPreview