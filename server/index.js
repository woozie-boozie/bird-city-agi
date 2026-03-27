const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const GameEngine = require('./game');
const world = require('./world');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// World data endpoint (client needs this to render the map)
app.get('/api/world', (req, res) => {
  res.json({
    width: world.WORLD_WIDTH,
    height: world.WORLD_HEIGHT,
    buildings: world.BUILDINGS,
    trees: world.TREES,
    park: world.PARK,
    cafeTables: world.CAFE_TABLES,
    roads: world.ROADS,
    cars: world.CARS,
    movingCarDefs: world.MOVING_CARS,
    laundry: world.LAUNDRY,
    birdTypes: world.BIRD_TYPES,
    skillCatalog: world.SKILL_CATALOG,
    birdColors: world.BIRD_COLORS,
    streetLamps: world.STREET_LAMPS,
  });
});

// Create game engine
const game = new GameEngine();

// Map socket.id → persistent birdId
const socketToBird = new Map();

// Socket.IO connections
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('join', async (data) => {
    // Use persistent ID from client, or generate one
    const persistentId = (data.id && typeof data.id === 'string' && data.id.length >= 8 && data.id.length <= 40)
      ? data.id
      : 'bird_' + Math.random().toString(36).slice(2, 12);
    const name = (data.name || '').trim().slice(0, 20) || 'Bird_' + Math.random().toString(36).slice(2, 6);

    // If this bird is already connected on another socket, remove the old one
    for (const [oldSocketId, oldBirdId] of socketToBird.entries()) {
      if (oldBirdId === persistentId && oldSocketId !== socket.id) {
        game.removeBird(persistentId);
        socketToBird.delete(oldSocketId);
      }
    }

    socketToBird.set(socket.id, persistentId);
    const bird = await game.addBird(persistentId, name);

    socket.emit('welcome', {
      id: persistentId,
      bird: {
        name: bird.name,
        x: bird.x, y: bird.y,
        type: bird.type,
        level: bird.level,
        xp: bird.xp,
      },
    });

    console.log(`[Socket] ${name} joined as ${bird.type} (id: ${persistentId})`);
  });

  socket.on('input', (input) => {
    const birdId = socketToBird.get(socket.id);
    if (birdId) {
      game.setInput(birdId, input);
    }
  });

  socket.on('action', (action) => {
    const birdId = socketToBird.get(socket.id);
    if (birdId) {
      game.handleAction(birdId, action);
    }
  });

  socket.on('disconnect', () => {
    const birdId = socketToBird.get(socket.id);
    if (birdId) {
      game.removeBird(birdId);
      socketToBird.delete(socket.id);
      console.log(`[Socket] Disconnected: ${birdId}`);
    }
  });
});

// Broadcast game state at 20Hz
setInterval(() => {
  const events = game.getEvents();
  const stats = game.getStats();

  for (const [socketId, socket] of io.sockets.sockets) {
    const birdId = socketToBird.get(socketId);
    if (birdId) {
      const state = game.getStateForBird(birdId);
      if (state) {
        socket.emit('state', state);
      }
    }
  }

  // Broadcast events to all
  if (events.length > 0) {
    io.emit('events', events);
  }
}, 50); // 20Hz

// Broadcast leaderboard every 5 seconds
setInterval(() => {
  const leaderboard = game.getLeaderboard();
  const stats = game.getStats();
  io.emit('leaderboard', { leaderboard, stats });
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🐦 BIRD CITY: CHAOS CENTRAL 🐦`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Open in multiple browser tabs to test multiplayer!\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  game.destroy();
  process.exit(0);
});
