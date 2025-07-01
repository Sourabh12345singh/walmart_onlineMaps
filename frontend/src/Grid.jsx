import React, { useEffect, useRef } from 'react';

// Canvas component to render the grid, path, and points
const Grid = ({ path, shelves, startPoint, endPoint, onClick, cellSize, gridWidth, gridHeight }) => {
  const canvasRef = useRef(null); // Define canvasRef

  useEffect(() => {
    const canvas = canvasRef.current; // Get canvas element
    const ctx = canvas.getContext('2d'); // Get 2D context
    canvas.width = gridWidth * cellSize; // Set canvas size
    canvas.height = gridHeight * cellSize;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;

    // Draw vertical grid lines
    for (let x = 0; x <= gridWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, gridHeight * cellSize);
      ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = 0; y <= gridHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(gridWidth * cellSize, y * cellSize);
      ctx.stroke();
    }

    // Draw the path
    if (path.length > 0) {
      ctx.fillStyle = '#00ff00'; // Green for path
      path.forEach(([x, y]) => {
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
      });
    }

    // Draw start point
    if (startPoint) {
      ctx.fillStyle = '#ff0000'; // Red for start
      ctx.beginPath();
      ctx.arc(startPoint.x * cellSize + cellSize / 2, startPoint.y * cellSize + cellSize / 2, cellSize / 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw end point
    if (endPoint) {
      ctx.fillStyle = '#0000ff'; // Blue for end
      ctx.beginPath();
      ctx.arc(endPoint.x * cellSize + cellSize / 2, endPoint.y * cellSize + cellSize / 2, cellSize / 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [path, shelves, startPoint, endPoint, cellSize, gridWidth, gridHeight]);

  return (
    <canvas
      ref={canvasRef}
      onClick={(e) => {
        // Access the canvas element through the ref
        const canvas = canvasRef.current;
        if (!canvas) return; // Add a check in case the ref is not yet assigned

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / cellSize); // Convert to grid cell
        const y = Math.floor((e.clientY - rect.top) / cellSize);
        onClick(x, y); // Pass grid cell coordinates
      }}
      style={{ width: `${gridWidth * cellSize}px`, height: `${gridHeight * cellSize}px`, position: 'absolute', zIndex: 10 }}
    />
  );
};

export default Grid;