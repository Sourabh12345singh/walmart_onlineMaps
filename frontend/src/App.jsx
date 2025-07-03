// App.jsx
import React, { useState } from 'react';
import Grid from './Grid';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './index.css';
import { findShortestPath } from './Pathfinding';

// Create a responsive grid layout component
const ResponsiveGridLayout = WidthProvider(Responsive);

function App() {
  // State for grid dimensions, shelves, points, path, and UI
  const [gridRows, setGridRows] = useState(30); // Default 30 rows
  const [gridCols, setGridCols] = useState(60); // Default 60 columns
  const [isPlacingShelf, setIsPlacingShelf] = useState(false); // Mode for placing shelves
  const [shelves, setShelves] = useState([]); // Array of shelf objects
  const [startPoint, setStartPoint] = useState(null); // Start point coordinates {x, y}
  const [endPoint, setEndPoint] = useState(null); // End point coordinates {x, y}
  const [selectedShelfId, setSelectedShelfId] = useState(''); // Selected shelf ID for end point
  const [path, setPath] = useState([]); // Path from A* algorithm
  const [pathLength, setPathLength] = useState(null); // Length of the shortest path
  const [shelfColor, setShelfColor] = useState('#ccc'); // Default shelf color
  const [shelfLabel, setShelfLabel] = useState(''); // Shelf label input
  const [error, setError] = useState(''); // Error message for no path
  const cellSize = 20; // Grid cell size in pixels

  // Create traversable grid for pathfinding
  const createTraversableGrid = () => {
    const grid = Array(gridRows)
      .fill()
      .map(() => Array(gridCols).fill(true));
    shelves.forEach(shelf => {
      const shelfX = Math.round(shelf.x / cellSize); // Round to nearest grid cell
      const shelfY = Math.round(shelf.y / cellSize);
      const shelfW = Math.round(shelf.w / cellSize); // Exact grid cells
      const shelfH = Math.round(shelf.h / cellSize);
      for (let y = shelfY; y < shelfY + shelfH && y < gridRows; y++) {
        for (let x = shelfX; x < shelfX + shelfW && x < gridCols; x++) {
          if (x >= 0 && y >= 0) {
            grid[y][x] = false; // Mark shelf cells as non-traversable
          }
        }
      }
    });
    console.log('Traversable grid created:', grid.map(row => row.map(cell => cell ? '.' : '#').join('')).join('\n'));
    return grid;
  };

  // Find nearest traversable cell to a given point
  const findNearestTraversableCell = (x, y, grid) => {
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 },  // Right
    ];
    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx >= 0 &&
        nx < gridCols &&
        ny >= 0 &&
        ny < gridRows &&
        grid[ny][nx]
      ) {
        return { x: nx, y: ny };
      }
    }
    return null; // No traversable cell found
  };

  // Handle grid click to place shelves or set start point
  const handleGridClick = (x, y) => {
    // Convert pixel coordinates to grid coordinates
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    // Validate coordinates
    if (gridX < 0 || gridX >= gridCols || gridY < 0 || gridY >= gridRows) return;

    if (isPlacingShelf) {
      // Add new shelf with user-specified color and label
      setShelves([
        ...shelves,
        {
          x: gridX * cellSize, // Align to grid
          y: gridY * cellSize,
          w: 2 * cellSize, // 2 grid cells wide
          h: 1 * cellSize, // 1 grid cell high
          i: shelves.length.toString(),
          color: shelfColor,
          label: shelfLabel || `Shelf ${shelves.length + 1}`,
        },
      ]);
      setIsPlacingShelf(false);
      setShelfLabel(''); // Reset label input
      setError('');
    } else if (!startPoint) {
      // Check if start point is on a traversable cell
      const grid = createTraversableGrid();
      if (grid[gridY][gridX]) {
        setStartPoint({ x: gridX, y: gridY });
        setError('');
      } else {
        setError('Cannot set start point on a shelf');
        console.warn('Cannot set start point on a shelf');
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
      setError('Invalid start point format');
      console.warn('Invalid start point format');
      return;
    }
    if (x >= 0 && x < gridCols && y >= 0 && y < gridRows) {
      const grid = createTraversableGrid();
      if (grid[y][x]) {
        setStartPoint({ x, y });
        setError('');
      } else {
        setError('Cannot set start point on a shelf');
        console.warn('Cannot set start point on a shelf');
      }
    }
  };

  // Handle search button click to set end point and calculate path
  const handleSearch = () => {
    if (!startPoint || !selectedShelfId) {
      setError('Start point or shelf not selected');
      console.warn('Start point or shelf not selected');
      return;
    }
    const selectedShelf = shelves.find(shelf => shelf.i === selectedShelfId);
    if (selectedShelf) {
      // Get shelf’s top-left corner
      const shelfX = Math.round(selectedShelf.x / cellSize);
      const shelfY = Math.round(selectedShelf.y / cellSize);
      const grid = createTraversableGrid();
      let newEndPoint = { x: shelfX, y: shelfY };
      // If top-left corner is not traversable, find nearest traversable cell
      if (!grid[shelfY][shelfX]) {
        newEndPoint = findNearestTraversableCell(shelfX, shelfY, grid);
        if (!newEndPoint) {
          setError('No traversable cell near the selected shelf');
          console.warn('No traversable cell near the selected shelf');
          setPath([]);
          setPathLength(null);
          setEndPoint(null);
          setSelectedShelfId('');
          return;
        }
      }
      setEndPoint(newEndPoint);
      console.log('Start point:', startPoint, 'End point:', newEndPoint);
      // Calculate path
      const pathCells = findShortestPath(startPoint, newEndPoint, grid);
      console.log('Path calculated:', pathCells);
      setPath(pathCells);
      setPathLength(pathCells.length > 0 ? pathCells.length - 1 : null);
      if (pathCells.length === 0) {
        setError('No path found to the selected shelf');
        console.warn('No path found to the selected shelf');
      } else {
        setError('');
      }
    }
  };

  // Calculate path when startPoint, endPoint, or shelves change
  React.useEffect(() => {
    if (startPoint && endPoint) {
      const grid = createTraversableGrid();
      const pathCells = findShortestPath(startPoint, endPoint, grid);
      console.log('Path updated:', pathCells);
      setPath(pathCells);
      setPathLength(pathCells.length > 0 ? pathCells.length - 1 : null);
      if (pathCells.length === 0) {
        setError('No path found to the selected shelf');
        console.warn('No path found to the selected shelf');
      } else {
        setError('');
      }
    } else {
      setPath([]);
      setPathLength(null);
      setError('');
    }
  }, [startPoint, endPoint, shelves]);

  // Handle shelf drag/resize stop to update shelf positions
  const onLayoutChange = (newLayout) => {
    setShelves(
      newLayout.map((item, index) => ({
        ...shelves[index],
        x: Math.round(item.x * cellSize), // Snap to grid
        y: Math.round(item.y * cellSize),
        w: Math.round(item.w * cellSize), // Ensure exact grid cells
        h: Math.round(item.h * cellSize),
      }))
    );
  };

  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, background: '#000', position: 'relative' }}>
      {/* Control panel for grid settings, shelf customization, and points */}
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
              backgroundColor: isPlacingShelf ? '#ddd' : '#fff',
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
              setPathLength(null);
              setSelectedShelfId('');
              setError('');
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
        <div>
          <label>Select End Point Shelf: </label>
          <select
            value={selectedShelfId}
            onChange={(e) => setSelectedShelfId(e.target.value)}
            style={{ width: '120px', marginRight: '10px' }}
          >
            <option value="">Select a shelf</option>
            {shelves.map(shelf => (
              <option key={shelf.i} value={shelf.i}>{shelf.label}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={!startPoint || !selectedShelfId}
            style={{
              padding: '10px 20px',
              backgroundColor: (!startPoint || !selectedShelfId) ? '#ddd' : '#fff',
              color: '#000',
              border: '1px solid #000',
              cursor: (!startPoint || !selectedShelfId) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
            }}
          >
            Search
          </button>
        </div>
        {pathLength !== null && (
          <div>
            <label>Path Length: </label>
            <span>{pathLength} {pathLength === 1 ? 'step' : 'steps'}</span>
          </div>
        )}
        {error && (
          <div style={{ color: 'red' }}>
            <label>Error: </label>
            <span>{error}</span>
          </div>
        )}
      </div>
      {/* Grid component for rendering the canvas */}
      <Grid
        path={path}
        shelves={shelves}
        onClick={handleGridClick}
        gridRows={gridRows}
        gridCols={gridCols}
        cellSize={cellSize}
        startPoint={startPoint}
        endPoint={endPoint}
      />
      {/* Responsive grid layout for shelves */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: shelves.map(shelf => ({
          ...shelf,
          x: Math.round(shelf.x / cellSize), // Convert to grid units
          y: Math.round(shelf.y / cellSize),
          w: Math.round(shelf.w / cellSize),
          h: Math.round(shelf.h / cellSize),
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