// Pathfinding.jsx
// A* pathfinding algorithm to find the shortest path between start and end points
export const findShortestPath = (start, end, traversableGrid) => {
  // Validate inputs
  if (!start || !end || !traversableGrid || !traversableGrid[0]) {
    console.warn('Invalid pathfinding inputs:', { start, end, traversableGrid });
    return [];
  }

  const gridWidth = traversableGrid[0].length;
  const gridHeight = traversableGrid.length;

  // Validate start and end points
  if (
    start.x < 0 || start.x >= gridWidth || start.y < 0 || start.y >= gridHeight ||
    end.x < 0 || end.x >= gridWidth || end.y < 0 || end.y >= gridHeight ||
    !traversableGrid[start.y][start.x] || !traversableGrid[end.y][end.x]
  ) {
    console.warn('Start or end point is out of bounds or non-traversable:', { start, end });
    return [];
  }

  // Initialize open set with start node
  const openSet = [{
    x: start.x,
    y: start.y,
    path: [], // Path to this node
    g: 0, // Cost from start
    f: 0, // Estimated total cost (g + h)
  }];
  const closedSet = new Set(); // Set of visited nodes (x,y)
  const directions = [
    { dx: 0, dy: -1 }, // Up
    { dx: 0, dy: 1 },  // Down
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 },  // Right
  ];

  // Heuristic function: Manhattan distance
  const heuristic = (x, y) => Math.abs(x - end.x) + Math.abs(y - end.y);

  // A* algorithm loop
  while (openSet.length > 0) {
    // Sort openSet by f-score and get node with lowest f
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    const key = `${current.x},${current.y}`;

    // Skip if already visited
    if (closedSet.has(key)) continue;
    closedSet.add(key);

    // Check if goal reached
    if (current.x === end.x && current.y === end.y) {
      const finalPath = [...current.path, [current.x, current.y]];
      console.log('Path found:', finalPath);
      return finalPath;
    }

    // Explore neighbors
    for (const { dx, dy } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const newKey = `${nx},${ny}`;

      // Check if neighbor is valid
      if (
        nx >= 0 &&
        nx < gridWidth &&
        ny >= 0 &&
        ny < gridHeight &&
        !closedSet.has(newKey) &&
        traversableGrid[ny][nx] // Must be traversable
      ) {
        const g = current.g + 1; // Cost to neighbor (1 per step)
        const h = heuristic(nx, ny); // Estimated cost to goal
        const f = g + h; // Total estimated cost
        openSet.push({
          x: nx,
          y: ny,
          path: [...current.path, [current.x, current.y]],
          g,
          f,
        });
      }
    }
  }

  // No path found
  console.log('No path found from', start, 'to', end);
  return [];
};