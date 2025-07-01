// A* algorithm to find the shortest path between start and end points
export const findShortestPath = (start, end, traversableGrid) => {
  const gridWidth = traversableGrid[0].length;
  const gridHeight = traversableGrid.length;
  const openSet = [{ x: start.x, y: start.y, path: [], g: 0, f: 0 }];
  const closedSet = new Set();
  const directions = [
    { dx: 0, dy: -1 }, // Up
    { dx: 0, dy: 1 },  // Down
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 },  // Right
  ];

  // Manhattan distance heuristic
  const heuristic = (x, y) => Math.abs(x - end.x) + Math.abs(y - end.y);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f); // Sort by f-score (g + h)
    const current = openSet.shift();
    const key = `${current.x},${current.y}`;

    if (closedSet.has(key)) continue;
    closedSet.add(key);

    if (current.x === end.x && current.y === end.y) {
      return [...current.path, [current.x, current.y]]; // Return the full path
    }

    for (const { dx, dy } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const newKey = `${nx},${ny}`;

      if (
        nx >= 0 &&
        nx < gridWidth &&
        ny >= 0 &&
        ny < gridHeight &&
        !closedSet.has(newKey) &&
        traversableGrid[ny][nx] // Ensure the cell is traversable
      ) {
        const g = current.g + 1;
        const h = heuristic(nx, ny);
        const f = g + h;
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

  return []; // Return empty array if no path is found
};