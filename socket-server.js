import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { Server } from 'socket.io';

const PORT = Number(process.env.SOCKET_PORT ?? 4001);
const BOARD_DATA_URL = process.env.BOARD_DATA_URL ?? 'http://127.0.0.1:8000/api/board-data';
const BOARD_POLL_MS = Number(process.env.BOARD_POLL_MS ?? 5000);

const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

let lastHash = '';
let lastPayload = null;

const hashPayload = (payload) =>
    createHash('sha1').update(JSON.stringify(payload)).digest('hex');

const broadcastBoardData = async () => {
    const response = await fetch(BOARD_DATA_URL);

    if (!response.ok) {
        throw new Error(`Failed to fetch board data (${response.status})`);
    }

    const payload = await response.json();
    const payloadHash = hashPayload(payload);

    if (payloadHash === lastHash) {
        return;
    }

    lastHash = payloadHash;
    lastPayload = payload;
    io.emit('board:update', payload);
};

io.on('connection', (socket) => {
    if (lastPayload) {
        socket.emit('board:update', lastPayload);
    }
});

httpServer.listen(PORT, async () => {
    console.log(`Socket server running on :${PORT}`);

    try {
        await broadcastBoardData();
    } catch (error) {
        console.error('Initial board data fetch failed:', error);
    }
});

setInterval(async () => {
    try {
        await broadcastBoardData();
    } catch (error) {
        console.error('Board data update failed:', error);
    }
}, BOARD_POLL_MS);
