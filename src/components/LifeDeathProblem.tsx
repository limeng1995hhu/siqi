'use client'

import { FC, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Board from '@sabaki/go-board'
import Sgf from '@sabaki/sgf'
import Goban from './Goban'

export type ProblemState = 'correct' | 'error' | 'pending'

interface LifeDeathProblemProps {
  solveState?: ProblemState
  initSgf: string
  onClick?: (count: number) => void
  onStateChange?: (state: ProblemState) => void
}

const LifeDeathProblem: FC<LifeDeathProblemProps> = ({
  solveState = 'pending',
  initSgf,
  onClick,
  onStateChange
}) => {
  const [problemState, setProblemState] = useState<ProblemState>(solveState)
  const [clickCount, setClickCount] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState(1)

  // 音效
  const placeStoneAudioRef = useRef<HTMLAudioElement>(null)
  const captureAudioRef = useRef<HTMLAudioElement>(null)

  const placeStoneControls = {
    play: () => {
      if (placeStoneAudioRef.current) {
        placeStoneAudioRef.current.currentTime = 0
        placeStoneAudioRef.current.play().catch(err => {
          console.error('落子音效播放失败:', err)
        })
      }
    }
  }

  const captureControls = {
    play: () => {
      if (captureAudioRef.current) {
        captureAudioRef.current.currentTime = 0
        captureAudioRef.current.play().catch(err => {
          console.error('提子音效播放失败:', err)
        })
      }
    }
  }

  // 初始化棋盘逻辑
  const { initialBoard, initialBoardState, stem, initialGameTree, boardSize, markerMap } = useMemo(() => {
    try {
      const initGameTree = Sgf.parse(initSgf)
      const rootNode = initGameTree[0]
      const rootData = rootNode.data

      // 获取棋盘参数
      const LB = rootData['LB'] || []
      const SZ = Number(rootData['SZ']?.[0]) || 19

      // 直接使用根节点C属性的内容作为题干
      let stem = rootData['C']?.[0] || ''
      stem = stem.replace(/\s+/g, ' ').trim()
      if (!stem) {
        stem = '请在棋盘上落子，解决这个死活题。黑先。'
      }

      // 创建初始棋盘
      const createEmptyBoard = (size: number) =>
        Array(size).fill(null).map(() => Array(size).fill(0)) as (0 | 1 | -1)[][]

      let board = new Board(createEmptyBoard(SZ))

      // 只处理根节点的AB/AW
      const nodeData = rootNode.data

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

      // 处理标记
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
        initialBoard: board,
        initialBoardState: board.signMap as (0 | 1 | -1)[][],
        stem,
        initialGameTree: rootNode,
        boardSize: SZ,
        markerMap
      }
    } catch (error) {
      console.error('SGF解析错误:', error)
      console.error('问题SGF:', initSgf)
      const SZ = 19
      const createEmptyBoard = (size: number) =>
        Array(size).fill(null).map(() => Array(size).fill(0)) as (0 | 1 | -1)[][]
      return {
        initialBoard: new Board(createEmptyBoard(SZ)),
        initialBoardState: createEmptyBoard(SZ),
        stem: '请在棋盘上落子',
        initialGameTree: { data: {}, children: [] },
        boardSize: SZ,
        markerMap: Array(SZ).fill(null).map(() => Array(SZ).fill(null))
      }
    }
  }, [initSgf])

  // 棋盘容器和棋子大小
  const BOARD_CONTAINER_SIZE = boardSize === 19 ? 530 : 490
  const vertexSize = Math.floor((BOARD_CONTAINER_SIZE - (boardSize === 19 ? 60 : 50)) / boardSize)

  // 棋盘状态管理 - 使用 key 来强制重置
  const [resetKey, setResetKey] = useState(0)
  const [boardInstance, setBoardInstance] = useState<Board>(initialBoard)
  const [boardState, setBoardState] = useState<(0 | 1 | -1)[][]>(initialBoardState)
  const [currentGameTree, setCurrentGameTree] = useState(initialGameTree)
  const [markerState, setMarkerState] = useState(markerMap)

  // 当 solveState 变为 pending 时，强制重置整个组件
  useEffect(() => {
    if (solveState === 'pending' && problemState !== 'pending') {
      setResetKey(k => k + 1)
    }
  }, [solveState])

  // 当 resetKey 变化时，重置所有状态
  useEffect(() => {
    setBoardInstance(initialBoard)
    setBoardState(initialBoardState)
    setCurrentGameTree(initialGameTree)
    setMarkerState(markerMap)
    setProblemState('pending')
    setCurrentPlayer(1)
    setClickCount(0)
  }, [resetKey, initialBoard, initialBoardState, initialGameTree, markerMap])

  // 监听 solveState 的变化
  useEffect(() => {
    setProblemState(solveState)
  }, [solveState])

  // 更新状态并通知父组件
  const updateProblemState = (newState: ProblemState) => {
    setProblemState(newState)
    onStateChange?.(newState)
  }

  // 棋盘点击处理
  const handleVertexClick = useCallback((_: unknown, coord: number[]) => {
    if (problemState === 'correct' || problemState === 'error') {
      return
    }

    const [x, y] = coord
    const moveAnalysis = (boardInstance as any).analyzeMove(currentPlayer, [x, y])
    if (moveAnalysis.suicide || moveAnalysis.overwrite) return

    let newBoard = boardInstance.makeMove(currentPlayer as 1 | -1, [x, y])

    let opponentHasMove = false
    const children = currentGameTree.children || []

    let foundValidMove = false
    let nextGameTree = currentGameTree

    for (const child of children) {
      if (currentPlayer === 1 && child.data.B) {
        const childMove = Array.isArray(child.data.B) ? child.data.B[0] : child.data.B
        if (childMove) {
          const childMoveX = childMove.charCodeAt(0) - 97
          const childMoveY = childMove.charCodeAt(1) - 97
          if (childMoveX === x && childMoveY === y) {
            foundValidMove = true
            if (child.children && child.children.length > 0) {
              const randomChild = child.children[Math.floor(Math.random() * child.children.length)]
              let opponentMove = ''
              let opponentPlayer = 0
              if (currentPlayer === 1 && randomChild.data.W) {
                opponentMove = Array.isArray(randomChild.data.W) ? randomChild.data.W[0] : randomChild.data.W
                opponentPlayer = -1
              } else if (randomChild.data.B) {
                opponentMove = Array.isArray(randomChild.data.B) ? randomChild.data.B[0] : randomChild.data.B
                opponentPlayer = 1
              }
              if (opponentMove) {
                const opponentMoveX = opponentMove.charCodeAt(0) - 97
                const opponentMoveY = opponentMove.charCodeAt(1) - 97
                newBoard = newBoard.makeMove(opponentPlayer as 1 | -1, [opponentMoveX, opponentMoveY])
                opponentHasMove = true
                nextGameTree = randomChild
              }
            } else {
              nextGameTree = child
            }
            break
          }
        }
      }
    }

    if (!foundValidMove) {
      updateProblemState('error')
    }

    setBoardInstance(newBoard)
    setBoardState(newBoard.signMap as (0 | 1 | -1)[][])
    setCurrentGameTree(nextGameTree)

    // 判断题目状态
    if (nextGameTree.children && nextGameTree.children.length === 0) {
      if (foundValidMove) {
        const hasPnsTrue = nextGameTree.data.PNS &&
          (Array.isArray(nextGameTree.data.PNS)
            ? nextGameTree.data.PNS[0] === 'T'
            : nextGameTree.data.PNS === 'T')
        if (hasPnsTrue || !nextGameTree.data.PNS) {
          updateProblemState('correct')
        } else {
          updateProblemState('error')
        }
      }
    }

    if (!opponentHasMove) {
      setCurrentPlayer(prev => prev === 1 ? -1 : 1)
    }

    // 播放音效
    if (moveAnalysis.capturing) {
      captureControls.play()
    } else {
      placeStoneControls.play()
    }

    onClick?.(clickCount + 1)
    setClickCount(c => c + 1)
  }, [boardInstance, currentPlayer, boardState, onClick, clickCount, currentGameTree, problemState])

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full" key={resetKey}>
      <audio ref={placeStoneAudioRef} src="/audio/place_stone.mp3" preload="auto" />
      <audio ref={captureAudioRef} src="/audio/capture.mp3" preload="auto" />

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
            onVertexClick={handleVertexClick}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 min-w-[300px]">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-2">{stem}</h2>
        </div>

        {problemState === 'correct' && (
          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 text-center">
            <p className="text-green-700 font-bold text-lg">正确！</p>
          </div>
        )}
        {problemState === 'error' && (
          <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 text-center">
            <p className="text-red-700 font-bold text-lg">错误，请重试</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LifeDeathProblem
