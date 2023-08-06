const SocketIO = require('socket.io');

// 서버
module.exports = (server, app) => {
    // 웹소켓과 익스프레스 서버가 연결됨
    const io = SocketIO( server, { path: '/socket.io' });
    
    app.set('io', io);
    // room 네임스페이스와 chat 네임스페이스 만들기
    const room = io.of('/room');
    const chat = io.of('/chat');

    room.on('connection', (socket) => {
        console.log('room 네임스페이스 접속');
        socket.on('disconnect', () => {
            console.log('room 네임스페이스 접속 해제');
        })
    });
    chat.on('connection', (socket) => {
        console.log('chat 네임스페이스 접속');
        socket.on('join', (data) => {
            socket.join(data); // data : 방 ID / 방에 들어가기
            // socket.leave(data); // 방에서 떠들 때
        })
        socket.on('disconnect', () => {
            console.log('chat 네임스페이스 접속 해제');
        })
    });
}