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

  const [currentGameTree, setCurrentGameTree] = useState(() => {
    try {
      return Sgf.parse(initSgf)[0]
    } catch (e) {
      console.error('SGF 解析错误:', e)
      return { data: {}, children: [] }
    }
  })

  // 初始化棋盘逻辑
  const { initialBoard, initialBoardState, stem } = useMemo(() => {
    try {
      const initGameTree = Sgf.parse(initSgf)
      const rootNode = initGameTree[0]
      const rootData = rootNode.data

      // 获取棋盘参数
      const AB = rootData['AB'] || []
      const AW = rootData['AW'] || []
      const SZ = Number(rootData['SZ']?.[0]) || 19

      // 解析注释中的STEM内容
      const comment = rootData['C']?.[0] || ''
      const stemMatch = comment.match(/STEM:(.*?)(?=OPTION|ANS:|$)/)
      const stem = stemMatch ? stemMatch[1].trim() : '请在棋盘上落子，解决这个死活题。黑先。'

      // 创建初始棋盘
      const createEmptyBoard = (size: number) =>
        Array(size).fill(null).map(() => Array(size).fill(0)) as (0 | 1 | -1)[][]

      let board = new Board(createEmptyBoard(SZ))

      // 添加棋子的工具函数
      const addStones = (board: Board, coords: string[], sign: 1 | -1) => {
        const coordArray = Array.isArray(coords) ? coords : [coords]
        return coordArray.reduce((currentBoard, coord) => {
          if (!coord) return currentBoard
          const x = coord.charCodeAt(0) - 97
          const y = coord.charCodeAt(1) - 97
          if (x >= 0 && y >= 0 && x < SZ && y < SZ) {
            return currentBoard.makeMove(sign, [x, y])
          }
          return currentBoard
        }, board)
      }
      // 应用初始棋子
      board = addStones(board, AB, 1)
      board = addStones(board, AW, -1)

      return {
        initialBoard: board,
        initialBoardState: board.signMap as (0 | 1 | -1)[][],
        stem
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
        stem: '请在棋盘上落子'
      }
    }
  }, [initSgf])

  // 棋盘状态管理
  const [boardInstance, setBoardInstance] = useState<Board>(initialBoard)
  const [boardState, setBoardState] = useState<(0 | 1 | -1)[][]>(initialBoardState)

  // 更新状态并通知父组件
  const updateProblemState = (newState: ProblemState) => {
    setProblemState(newState)
    onStateChange?.(newState)
  }

  // 添加对 initSgf 变化的监听
  useEffect(() => {
    if (solveState === 'pending') {
      try {
        const newGameTree = Sgf.parse(initSgf)[0]
        setBoardInstance(initialBoard)
        setBoardState(initialBoardState)
        setCurrentPlayer(1)
        setClickCount(0)
        setCurrentGameTree(newGameTree)
        setProblemState('pending')
      } catch (e) {
        console.error('重置棋盘失败:', e)
      }
    }
  }, [initSgf, initialBoard, initialBoardState, solveState])

  // 监听 solveState 的变化
  useEffect(() => {
    setProblemState(solveState)
  }, [solveState])

  // 修改重置函数
  const resetBoard = useCallback(() => {
    try {
      const newGameTree = Sgf.parse(initSgf)[0]
      setBoardInstance(initialBoard)
      setBoardState(initialBoardState)
      setCurrentPlayer(1)
      setClickCount(0)
      setCurrentGameTree(newGameTree)
      setProblemState('pending')
      onStateChange?.('pending')
    } catch (e) {
      console.error('重置棋盘失败:', e)
    }
  }, [initSgf, initialBoard, initialBoardState, onStateChange])

  // 棋盘点击处理
  const handleVertexClick = useCallback((_: unknown, coord: number[]) => {
    if (problemState === 'correct' || problemState === 'error') {
      return
    }

    const [x, y] = coord
    const moveAnalysis = boardInstance.analyzeMove(currentPlayer, [x, y])
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

    if (nextGameTree.children && nextGameTree.children.length === 0) {
      if (nextGameTree.data.PNS && nextGameTree.data.PNS[0] === 'T') {
        updateProblemState('correct')
      } else {
        updateProblemState('error')
      }
    }

    if (!opponentHasMove) {
      setCurrentPlayer(prev => prev === 1 ? -1 : 1)
    }

    if (moveAnalysis.capturing) {
      captureControls.play()
    } else {
      placeStoneControls.play()
    }

    onClick?.(clickCount + 1)
    setClickCount(c => c + 1)
  }, [boardInstance, currentPlayer, boardState, onClick, clickCount, currentGameTree, problemState])

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <audio ref={placeStoneAudioRef} src="/audio/place_stone.mp3" preload="auto" />
      <audio ref={captureAudioRef} src="/audio/capture.mp3" preload="auto" />

      <div className="flex justify-center lg:justify-start">
        <div
          style={{
            width: '500px',
            height: '500px',
          }}
        >
          <Goban
            vertexSize={40}
            signMap={boardState}
            onVertexClick={handleVertexClick}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-2">{stem}</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetBoard}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors"
          >
            重置
          </button>
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
