import React, { useState, useEffect } from 'react';
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Grid from './Grid';
import { findShortestPath } from './Pathfinding';

const GridLayout = WidthProvider(ResponsiveGridLayout);

// Check if a shelf overlaps with existing shelves
const doesShelfOverlap = (newShelf, existingShelves) => {
  for (const shelf of existingShelves) {
    if (
      newShelf.x < shelf.x + shelf.w &&
      newShelf.x + newShelf.w > shelf.x &&
      newShelf.y < shelf.y + shelf.h &&
      newShelf.y + newShelf.h > shelf.y
    ) {
      return true; // Overlap detected
    }
  }
  return false; // No overlap
};

// Main component for the supermarket map
function App() {
  const cellSize = 20; // Size of each grid cell in pixels
  const gridWidth = 60; // 1200px / 20
  const gridHeight = 30; // 600px / 20
  const [isPlacingShelf, setIsPlacingShelf] = useState(false);
  const [shelves, setShelves] = useState([]); // Shelves in grid cell coordinates
  const [startPoint, setStartPoint] = useState(null); // Start point in grid cells
  const [endPoint, setEndPoint] = useState(null); // End point in grid cells
  const [path, setPath] = useState([]); // Path as array of [x, y] grid cells
  const [traversableGrid, setTraversableGrid] = useState(
    Array(gridHeight).fill().map(() => Array(gridWidth).fill(true))
  ); // 2D grid: true = traversable, false = blocked
  const [shelfColor, setShelfColor] = useState('#ffffff'); // Default to white

  // Update traversable grid when shelves change
  useEffect(() => {
    const newGrid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(true));
    shelves.forEach(shelf => {
      // Ensure shelf bounds are valid
      if (
        shelf.x >= 0 &&
        shelf.y >= 0 &&
        shelf.x + shelf.w <= gridWidth &&
        shelf.y + shelf.h <= gridHeight
      ) {
        for (let y = shelf.y; y < shelf.y + shelf.h; y++) {
          for (let x = shelf.x; x < shelf.x + shelf.w; x++) {
            newGrid[y][x] = false; // Mark shelf cells as non-traversable
          }
        }
      }
    });
    setTraversableGrid(newGrid);

    // Recalculate path if start and end points are set
    if (startPoint && endPoint) {
      const newPath = findShortestPath(startPoint, endPoint, newGrid);
      setPath(newPath);
    }
  }, [shelves, startPoint, endPoint, gridWidth, gridHeight]);

  // Handle clicks on the grid for placing shelves or setting points
  const handleGridClick = (x, y) => {
    if (isPlacingShelf) {
      const newShelf = { x, y, w: 2, h: 1, i: shelves.length.toString() };
      // Check if shelf is within bounds and cells are traversable
      if (
        x + 2 <= gridWidth &&
        y < gridHeight &&
        traversableGrid[y][x] &&
        traversableGrid[y][x + 1] &&
        !doesShelfOverlap(newShelf, shelves)
      ) {
        setShelves([...shelves, newShelf]);
        setIsPlacingShelf(false);
      }
    } else if (!traversableGrid[y][x]) {
      return; // Prevent setting points on non-traversable cells
    } else if (!startPoint) {
      setStartPoint({ x, y }); // Set start point
    } else if (!endPoint && (x !== startPoint.x || y !== startPoint.y)) {
      setEndPoint({ x, y }); // Set end point
      const newPath = findShortestPath(startPoint, { x, y }, traversableGrid);
      setPath(newPath); // Calculate path
    }
  };

  return (
    // Container with fixed dimensions
    <div style={{ width: '1200px', height: '600px', position: 'relative', background: '#000' }}>
      {/* Buttons and color picker for user interaction */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => setIsPlacingShelf(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#fff',
            color: '#000',
            border: '1px solid #000',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Place Shelf
        </button>
        <button
          onClick={() => {
            setStartPoint(null);
            setEndPoint(null);
            setPath([]); // Clear path and points
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#fff',
            color: '#000',
            border: '1px solid #000',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Clear Path
        </button>
        <input
          type="color"
          value={shelfColor}
          onChange={(e) => setShelfColor(e.target.value)}
          style={{ cursor: 'pointer' }}
        />
      </div>
      {/* Canvas grid component */}
      <Grid
        path={path}
        shelves={shelves}
        startPoint={startPoint}
        endPoint={endPoint}
        onClick={handleGridClick}
        cellSize={cellSize}
        gridWidth={gridWidth}
        gridHeight={gridHeight}
        style={{ position: 'absolute', zIndex: 10 }}
      />
      {/* GridLayout for draggable/resizable shelves */}
      <GridLayout
        className="layout"
        layouts={{ lg: shelves }}
        cols={{ lg: gridWidth, md: gridWidth, sm: gridWidth }}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        rowHeight={cellSize}
        width={1200}
        isDraggable={true}
        isResizable={true}
        style={{ position: 'absolute', top: '0', left: '0', zIndex: 0 }}
        onLayoutChange={(newLayout) => {
          // Update shelves and ensure grid cell alignment
          const updatedShelves = newLayout.map(shelf => ({
            ...shelf,
            x: Math.round(shelf.x),
            y: Math.round(shelf.y),
            w: Math.max(1, Math.round(shelf.w)),
            h: Math.max(1, Math.round(shelf.h)),
          }));
          // Only update if no overlaps
          if (
            !updatedShelves.some((shelf, index) =>
              doesShelfOverlap(shelf, updatedShelves.filter((_, i) => i !== index))
            )
          ) {
            setShelves(updatedShelves);
          }
        }}
      >
        {shelves.map(shelf => (
          <div
            key={shelf.i}
            style={{
              background: shelfColor,
              border: '1px solid #000',
              pointerEvents: isPlacingShelf ? 'none' : 'auto',
            }}
          >
            Shelf {shelf.i}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}

export default App;