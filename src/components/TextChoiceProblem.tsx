'use client'

import { FC, useState, useMemo, useEffect } from 'react'
import Board from '@sabaki/go-board'
import Sgf from '@sabaki/sgf'
import Goban from './Goban'
import type { ProblemState, TextChoiceProblemProps, TextChoiceOption } from '../types'

const cleanSgf = (sgf: string): string => {
  if (!sgf) return sgf
  let cleaned = sgf.trim()
  if (!cleaned.startsWith('(')) {
    cleaned = '(' + cleaned
  }
  if (!cleaned.endsWith(')')) {
    cleaned = cleaned + ')'
  }
  return cleaned
}

const TextChoiceProblem: FC<TextChoiceProblemProps> = ({
  solveState = 'pending',
  initSgf,
  question,
  options,
  onSelect,
  onStateChange: _onStateChange,
}) => {
  const [problemState, setProblemState] = useState<ProblemState>(solveState)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const { initialBoardState, markerMap, boardSize } = useMemo(() => {
    try {
      const cleanedSgf = cleanSgf(initSgf)
      const initGameTree = Sgf.parse(cleanedSgf)
      const rootNode = initGameTree[0]
      const rootData = rootNode.data
      const SZ = Number(rootData['SZ']?.[0]) || 19

      const createEmptyBoard = (size: number) =>
        Array(size).fill(null).map(() => Array(size).fill(0))

      let board = new Board(createEmptyBoard(SZ))
      let lastNode = rootNode

      let currentNode: any = rootNode
      while (currentNode) {
        const nodeData = currentNode.data
        lastNode = currentNode

        if (nodeData['AB']) {
          const AB = Array.isArray(nodeData['AB']) ? nodeData['AB'] : [nodeData['AB']]
          AB.forEach((coord: string) => {
            const x = coord.charCodeAt(0) - 97
            const y = coord.charCodeAt(1) - 97
            if (x >= 0 && y >= 0 && x < SZ && y < SZ) {
              board = board.makeMove(1, [x, y])
            }
          })
        }

        if (nodeData['AW']) {
          const AW = Array.isArray(nodeData['AW']) ? nodeData['AW'] : [nodeData['AW']]
          AW.forEach((coord: string) => {
            const x = coord.charCodeAt(0) - 97
            const y = coord.charCodeAt(1) - 97
            if (x >= 0 && y >= 0 && x < SZ && y < SZ) {
              board = board.makeMove(-1, [x, y])
            }
          })
        }

        if (nodeData['B']) {
          const B = Array.isArray(nodeData['B']) ? nodeData['B'][0] : nodeData['B']
          if (B) {
            const x = B.charCodeAt(0) - 97
            const y = B.charCodeAt(1) - 97
            if (x >= 0 && y >= 0 && x < SZ && y < SZ) {
              board = board.makeMove(1, [x, y])
            }
          }
        }

        if (nodeData['W']) {
          const W = Array.isArray(nodeData['W']) ? nodeData['W'][0] : nodeData['W']
          if (W) {
            const x = W.charCodeAt(0) - 97
            const y = W.charCodeAt(1) - 97
            if (x >= 0 && y >= 0 && x < SZ && y < SZ) {
              board = board.makeMove(-1, [x, y])
            }
          }
        }

        currentNode = currentNode.children?.[0]
      }

      const LB = lastNode.data['LB'] || []
      const markerMap = Array(SZ).fill(null).map(() => Array(SZ).fill(null))
      if (Array.isArray(LB)) {
        LB.forEach((label: string) => {
          const [coord, text] = label.split(':')
          const x = coord.charCodeAt(0) - 97
          const y = coord.charCodeAt(1) - 97
          if (x >= 0 && y >= 0 && x < SZ && y < SZ) {
            markerMap[y][x] = { type: 'label', label: text }
          }
        })
      }

      return {
        initialBoardState: board.signMap,
        markerMap,
        boardSize: SZ
      }
    } catch (error) {
      console.error('SGF解析错误:', error)
      console.error('问题SGF:', initSgf)
      const SZ = 19
      const createEmptyBoard = (size: number) =>
        Array(size).fill(null).map(() => Array(size).fill(0))
      return {
        initialBoardState: createEmptyBoard(SZ),
        markerMap: Array(SZ).fill(null).map(() => Array(SZ).fill(null)),
        boardSize: SZ
      }
    }
  }, [initSgf])

  const BOARD_CONTAINER_SIZE = boardSize === 19 ? 530 : 490
  const vertexSize = Math.floor((BOARD_CONTAINER_SIZE - (boardSize === 19 ? 60 : 50)) / boardSize)

  const [boardState, setBoardState] = useState(initialBoardState)
  const [markerState, setMarkerState] = useState(markerMap)

  useEffect(() => {
    setBoardState(initialBoardState)
    setMarkerState(markerMap)
  }, [initialBoardState, markerMap])

  const handleOptionClick = (optionId: number) => {
    if (problemState !== 'pending') return
    setSelectedOption(optionId)
    onSelect?.(optionId)
  }

  useEffect(() => {
    if (problemState !== 'pending' || solveState !== 'pending') {
      setProblemState(solveState)
    }
  }, [solveState, problemState])

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="flex justify-center lg:justify-start lg:flex-[2]">
        <div
          style={{
            width: `${BOARD_CONTAINER_SIZE}px`,
            height: `${BOARD_CONTAINER_SIZE}px`,
          }}
        >
          <Goban
            vertexSize={vertexSize}
            signMap={boardState}
            markerMap={markerState}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 min-w-[300px]">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-2">{question}</h2>
        </div>

        <div className="w-full space-y-3">
          {options.map((option: TextChoiceOption) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={problemState !== 'pending'}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                selectedOption === option.id
                  ? problemState === 'correct'
                    ? 'bg-green-100 border-green-500'
                    : problemState === 'error'
                    ? 'bg-red-100 border-red-500'
                    : 'bg-blue-100 border-blue-500'
                  : 'hover:bg-gray-50 border-gray-300 bg-white'
              }`}
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TextChoiceProblem
