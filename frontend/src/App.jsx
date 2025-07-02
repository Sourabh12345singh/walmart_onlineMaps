// App.jsx
import React, { useState } from 'react';
import Grid from './Grid';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './index.css';
import { findShortestPath } from './Pathfinding';

const ResponsiveGridLayout = WidthProvider(Responsive);

function App() {
  // State for grid dimensions, shelves, points, and path
  const [gridRows, setGridRows] = useState(30); // Default 30 rows
  const [gridCols, setGridCols] = useState(60); // Default 60 columns
  const [isPlacingShelf, setIsPlacingShelf] = useState(false);
  const [shelves, setShelves] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [path, setPath] = useState([]);
  const [shelfColor, setShelfColor] = useState('#ccc'); // Default shelf color
  const [shelfLabel, setShelfLabel] = useState(''); // Shelf label input
  const cellSize = 50; // Grid cell size in pixels

  // Handle grid click to place shelves or set start/end points
  const handleGridClick = (x, y) => {
    // Convert pixel coordinates to grid coordinates
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    if (gridX < 0 || gridX >= gridCols || gridY < 0 || gridY >= gridRows) return;

    if (isPlacingShelf) {
      // Add new shelf with user-specified color and label
      setShelves([
        ...shelves,
        {
          x: gridX * cellSize, // Align to grid
          y: gridY * cellSize,
          w: 2 * cellSize, // Default width: 2 cells
          h: 1 * cellSize, // Default height: 1 cell
          i: shelves.length.toString(),
          color: shelfColor,
          label: shelfLabel || `Shelf ${shelves.length + 1}`,
        },
      ]);
      setIsPlacingShelf(false);
      setShelfLabel(''); // Reset label input
    } else if (!startPoint) {
      setStartPoint({ x: gridX, y: gridY });
    } else if (!endPoint) {
      // Check if click is on a shelf
      const clickedShelf = shelves.find(shelf => {
        const shelfX = Math.floor(shelf.x / cellSize);
        const shelfY = Math.floor(shelf.y / cellSize);
        const shelfW = Math.floor(shelf.w / cellSize);
        const shelfH = Math.floor(shelf.h / cellSize);
        return (
          gridX >= shelfX &&
          gridX < shelfX + shelfW &&
          gridY >= shelfY &&
          gridY < shelfY + shelfH
        );
      });
      if (clickedShelf) {
        // Set end point to the top-left corner of the clicked shelf
        setEndPoint({ x: Math.floor(clickedShelf.x / cellSize), y: Math.floor(clickedShelf.y / cellSize) });
      }
    }
  };

  // Handle manual input for start point (e.g., "2,3" or "A1")
  const handleStartPointInput = (input) => {
    let x, y;
    if (input.match(/^[A-Za-z]\d+$/)) {
      // Handle "A1" format
      const colLetter = input[0].toUpperCase();
      const rowNum = parseInt(input.slice(1)) - 1;
      x = colLetter.charCodeAt(0) - 'A'.charCodeAt(0);
      y = rowNum;
    } else if (input.match(/^\d+,\d+$/)) {
      // Handle "row,col" format
      [y, x] = input.split(',').map(num => parseInt(num));
    } else {
      return; // Invalid input
    }
    if (x >= 0 && x < gridCols && y >= 0 && y < gridRows) {
      setStartPoint({ x, y });
    }
  };

  // Calculate path when start and end points are set
  const calculatePath = () => {
    if (startPoint && endPoint) {
      // Create traversable grid
      const grid = Array(gridRows)
        .fill()
        .map(() => Array(gridCols).fill(true));
      shelves.forEach(shelf => {
        const shelfX = Math.floor(shelf.x / cellSize);
        const shelfY = Math.floor(shelf.y / cellSize);
        const shelfW = Math.floor(shelf.w / cellSize);
        const shelfH = Math.floor(shelf.h / cellSize);
        for (let y = shelfY; y < shelfY + shelfH && y < gridRows; y++) {
          for (let x = shelfX; x < shelfX + shelfW && x < gridCols; x++) {
            grid[y][x] = false; // Mark shelf cells as non-traversable
          }
        }
      });
      // Find shortest path using A* algorithm
      const pathCells = findShortestPath(startPoint, endPoint, grid);
      setPath(pathCells);
    }
  };

  // Update path whenever startPoint or endPoint changes
  React.useEffect(() => {
    calculatePath();
  }, [startPoint, endPoint, shelves]);

  // Handle shelf drag/resize stop to update shelf positions
  const onLayoutChange = (newLayout) => {
    setShelves(
      newLayout.map((item, index) => ({
        ...shelves[index],
        x: item.x * cellSize, // Convert to pixel coordinates
        y: item.y * cellSize,
        w: item.w * cellSize,
        h: item.h * cellSize,
      }))
    );
  };

  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, background: '#000', position: 'relative' }}>
      {/* Control panel for grid settings, shelf customization, and start point */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff', padding: '10px', borderRadius: '5px' }}>
        <div>
          <label>Grid Rows: </label>
          <input
            type="number"
            value={gridRows}
            onChange={(e) => setGridRows(Math.max(1, parseInt(e.target.value) || 30))}
            style={{ width: '60px', marginRight: '10px' }}
          />
          <label>Grid Columns: </label>
          <input
            type="number"
            value={gridCols}
            onChange={(e) => setGridCols(Math.max(1, parseInt(e.target.value) || 60))}
            style={{ width: '60px' }}
          />
        </div>
        <div>
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
              setPath([]);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#fff',
              color: '#000',
              border: '1px solid #000',
              cursor: 'pointer',
              fontSize: '16px',
              marginLeft: '10px',
            }}
          >
            Clear Path
          </button>
        </div>
        <div>
          <label>Shelf Color: </label>
          <input
            type="color"
            value={shelfColor}
            onChange={(e) => setShelfColor(e.target.value)}
            style={{ marginRight: '10px' }}
          />
          <label>Shelf Label: </label>
          <input
            type="text"
            value={shelfLabel}
            onChange={(e) => setShelfLabel(e.target.value)}
            placeholder="Enter shelf label"
            style={{ width: '120px' }}
          />
        </div>
        <div>
          <label>Start Point (e.g., "2,3" or "A1"): </label>
          <input
            type="text"
            onChange={(e) => handleStartPointInput(e.target.value)}
            placeholder="Enter start point"
            style={{ width: '100px' }}
          />
        </div>
      </div>
      {/* Grid component for rendering the canvas */}
      <Grid
        path={path}
        shelves={shelves}
        onClick={handleGridClick}
        gridRows={gridRows}
        gridCols={gridCols}
        cellSize={cellSize}
      />
      {/* Responsive grid layout for shelves */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: shelves.map(shelf => ({
          ...shelf,
          x: Math.floor(shelf.x / cellSize),
          y: Math.floor(shelf.y / cellSize),
          w: Math.floor(shelf.w / cellSize),
          h: Math.floor(shelf.h / cellSize),
        })) }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: gridCols, md: gridCols, sm: gridCols, xs: gridCols, xxs: gridCols }}
        rowHeight={cellSize}
        width={gridCols * cellSize}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 5 }}
        onLayoutChange={onLayoutChange}
        isDraggable
        isResizable
      >
        {shelves.map(shelf => (
          <div
            key={shelf.i}
            style={{
              background: shelf.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #000',
              color: '#000',
              fontSize: '14px',
            }}
          >
            {shelf.label}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

export default App;