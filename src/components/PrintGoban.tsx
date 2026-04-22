import { FC } from 'react'

interface PrintGobanProps {
  signMap: (0 | 1 | -1)[][]
  markerMap: (any | null)[][]
  rangeX?: [number, number]
  rangeY?: [number, number]
  showCoordinates?: boolean
  boardSize?: number
}

// 打印用的纯 SVG 棋盘组件
export const PrintGoban: FC<PrintGobanProps> = ({
  signMap,
  markerMap,
  rangeX,
  rangeY,
  showCoordinates = false,
  boardSize = 19
}) => {
  // 计算显示范围
  const startX = rangeX ? rangeX[0] : 0
  const endX = rangeX ? rangeX[1] : boardSize - 1
  const startY = rangeY ? rangeY[0] : 0
  const endY = rangeY ? rangeY[1] : boardSize - 1

  const displayWidth = endX - startX + 1
  const displayHeight = endY - startY + 1

  // 棋盘尺寸 - 缩小以适应一行3个
  const boardPadding = 15
  const cellSize = 22
  const boardWidth = boardPadding * 2 + (displayWidth - 1) * cellSize
  const boardHeight = boardPadding * 2 + (displayHeight - 1) * cellSize
  const stoneRadius = cellSize * 0.42

  // 坐标标签
  const coordLabels = 'ABCDEFGHJKLMNOPQRST'.split('')

  // 星位
  const getStarPoints = (size: number): [number, number][] => {
    if (size === 19) {
      return [[3, 3], [3, 9], [3, 15], [9, 3], [9, 9], [9, 15], [15, 3], [15, 9], [15, 15]]
    } else if (size === 13) {
      return [[3, 3], [3, 9], [9, 3], [9, 9]]
    } else if (size === 9) {
      return [[4, 4]]
    }
    return []
  }

  // 获取范围内的星位
  const starPoints = getStarPoints(boardSize).filter(([x, y]) =>
    x >= startX && x <= endX && y >= startY && y <= endY
  ).map(([x, y]) => [x - startX, y - startY] as [number, number])

  // 渲染网格线
  const renderGridLines = () => {
    const lines = []

    // 垂直线
    for (let x = 0; x < displayWidth; x++) {
      lines.push(
        <line
          key={`v${x}`}
          x1={boardPadding + x * cellSize}
          y1={boardPadding}
          x2={boardPadding + x * cellSize}
          y2={boardPadding + (displayHeight - 1) * cellSize}
          stroke="#5E2E0C"
          strokeWidth="1"
        />
      )
    }

    // 水平线
    for (let y = 0; y < displayHeight; y++) {
      lines.push(
        <line
          key={`h${y}`}
          x1={boardPadding}
          y1={boardPadding + y * cellSize}
          x2={boardPadding + (displayWidth - 1) * cellSize}
          y2={boardPadding + y * cellSize}
          stroke="#5E2E0C"
          strokeWidth="1"
        />
      )
    }

    return lines
  }

  // 渲染星位
  const renderStarPoints = () => {
    return starPoints.map(([x, y], idx) => (
      <circle
        key={idx}
        cx={boardPadding + x * cellSize}
        cy={boardPadding + y * cellSize}
        r={3}
        fill="#5E2E0C"
      />
    ))
  }

  // 渲染棋子
  const renderStones = () => {
    const stones = []

    for (let y = 0; y < displayHeight; y++) {
      for (let x = 0; x < displayWidth; x++) {
        const actualX = startX + x
        const actualY = startY + y
        const sign = signMap[actualY]?.[actualX]

        if (sign !== 0 && sign !== undefined) {
          const cx = boardPadding + x * cellSize
          const cy = boardPadding + y * cellSize

          // 阴影
          stones.push(
            <circle
              key={`shadow-${x}-${y}`}
              cx={cx + 1.5}
              cy={cy + 2}
              r={stoneRadius}
              fill="rgba(0, 0, 0, 0.3)"
            />
          )

          // 棋子本体
          stones.push(
            <circle
              key={`stone-${x}-${y}`}
              cx={cx}
              cy={cy}
              r={stoneRadius}
              fill={sign === 1 ? '#222' : '#eee'}
            />
          )

          // 棋子高光效果（仅白棋）
          if (sign === -1) {
            stones.push(
              <ellipse
                key={`highlight-${x}-${y}`}
                cx={cx - stoneRadius * 0.3}
                cy={cy - stoneRadius * 0.3}
                rx={stoneRadius * 0.3}
                ry={stoneRadius * 0.2}
                fill="rgba(255, 255, 255, 0.7)"
              />
            )
          }

          // 棋子上的标记
          const marker = markerMap[actualY]?.[actualX]
          if (marker?.type === 'label') {
            stones.push(
              <text
                key={`label-${x}-${y}`}
                x={cx}
                y={cy + stoneRadius * 0.25}
                textAnchor="middle"
                fontSize={stoneRadius * 0.8}
                fontWeight="bold"
                fill={sign === 1 ? '#eee' : '#222'}
              >
                {marker.label}
              </text>
            )
          }
        }
      }
    }

    return stones
  }

  return (
    <svg
      width={boardWidth + (showCoordinates ? 25 : 0)}
      height={boardHeight + (showCoordinates ? 25 : 0)}
      viewBox={`0 0 ${boardWidth + (showCoordinates ? 25 : 0)} ${boardHeight + (showCoordinates ? 25 : 0)}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 棋盘背景 */}
      <rect
        x={0}
        y={0}
        width={boardWidth}
        height={boardHeight}
        fill="#F1B458"
        stroke="#CA933A"
        strokeWidth="3"
      />

      {/* 网格线 */}
      <g className="grid-lines">
        {renderGridLines()}
      </g>

      {/* 星位 */}
      <g className="star-points">
        {renderStarPoints()}
      </g>

      {/* 棋子 */}
      <g className="stones">
        {renderStones()}
      </g>

      {/* X轴坐标 */}
      {showCoordinates && (
        <g className="coord-x" transform={`translate(${boardPadding}, ${boardHeight + 5})`}>
          {Array.from({ length: displayWidth }, (_, i) => (
            <text
              key={i}
              x={i * cellSize}
              y={0}
              textAnchor="middle"
              fontSize="10"
              fill="#5E2E0C"
            >
              {coordLabels[startX + i]}
            </text>
          ))}
        </g>
      )}

      {/* Y轴坐标 */}
      {showCoordinates && (
        <g className="coord-y" transform={`translate(5, ${boardPadding})`}>
          {Array.from({ length: displayHeight }, (_, i) => (
            <text
              key={i}
              x={0}
              y={i * cellSize + 4}
              textAnchor="middle"
              fontSize="10"
              fill="#5E2E0C"
            >
              {startY + i + 1}
            </text>
          ))}
        </g>
      )}
    </svg>
  )
}

export default PrintGoban