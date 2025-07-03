// Grid.jsx
import React, { useEffect, useRef } from 'react';
import { findShortestPath } from './Pathfinding';

// Grid component for rendering the canvas and handling clicks
const Grid = ({ path, shelves, onClick, gridRows, gridCols, cellSize, startPoint, endPoint }) => {
  const canvasRef = useRef(null);

  // Draw the grid, path, and start/end points on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = gridCols * cellSize;
    canvas.height = gridRows * cellSize;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 0.5;

    // Draw vertical grid lines
    for (let x = 0; x <= gridCols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, gridRows * cellSize);
      ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = 0; y <= gridRows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(gridCols * cellSize, y * cellSize);
      ctx.stroke();
    }

    // Draw path
    if (path.length > 0) {
      console.log('Rendering path:', path);
      ctx.fillStyle = '#00ff00'; // Green path
      path.forEach(([x, y]) => {
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
      });
    } else {
      console.log('No path to render');
    }

    // Draw start point (red square)
    if (startPoint) {
      ctx.fillStyle = '#ff0000'; // Red for start point
      ctx.fillRect(startPoint.x * cellSize + 1, startPoint.y * cellSize + 1, cellSize - 2, cellSize - 2);
    }

    // Draw end point (red location pin)
    if (endPoint) {
      ctx.fillStyle = '#ff0000'; // Red for end point
      const x = endPoint.x * cellSize + cellSize / 2;
      const y = endPoint.y * cellSize + cellSize / 2;
      // Draw circle for pin head
      ctx.beginPath();
      ctx.arc(x, y - cellSize / 4, cellSize / 4, 0, 2 * Math.PI);
      ctx.fill();
      // Draw triangle for pin base
      ctx.beginPath();
      ctx.moveTo(x - cellSize / 4, y - cellSize / 4);
      ctx.lineTo(x + cellSize / 4, y - cellSize / 4);
      ctx.lineTo(x, y + cellSize / 4);
      ctx.closePath();
      ctx.fill();
    }
  }, [path, shelves, gridRows, gridCols, cellSize, startPoint, endPoint]);

  // Handle canvas click and convert to grid coordinates
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onClick(x, y);
    // Display coordinates (for user feedback)
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);
    console.log(`Clicked cell: (${gridY},${gridX}) or ${String.fromCharCode(65 + gridX)}${gridY + 1}`);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="absolute top-0 left-0 z-0"
      style={{ background: '#333' }}
    />
  );
};

export default Grid;