const SocketIO = require('socket.io');
const { removeRoom } = require('./services');

// 서버
module.exports = (server, app, sessionMiddleware) => {
    // 웹소켓과 익스프레스 서버가 연결됨
    const io = SocketIO( server, { path: '/socket.io' });
    app.set('io', io);
    // room 네임스페이스와 chat 네임스페이스 만들기
    const room = io.of('/room');
    const chat = io.of('/chat');

    // chat.use(sessionMiddleware); 바로 사용 못함 req, res, next 형태가 아니라서
    // (socket, next)로된 middleware를 req, res, next 형태로 바꾸어줌
    // 이것으로 시스템 메시지를 보내줄 수 있음
    const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
    chat.use(wrap(sessionMiddleware));

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
            // 방 참가시 system에서 참가했다고 띄워주기
            socket.to(data).emit('join', {
                user: 'system',
                chat: `${socket.request.session.color}님이 입장하셨습니다.`
            }); 
            // socket.leave(data); // 방에서 떠들 때
        })
        socket.on('disconnect', async () => {
            console.log('chat 네임스페이스 접속 해제');
            // roomId 빼내기 -> 브라우저 경로에서 떼내기
            const { referer } = socket.request.headers; // /room/방아이디
            const roomId = new URL(referer).pathname.split('/').at(-1); // 마지막거
            const currentRoom = chat.adapter.rooms.get(roomId); // 현재의 방
            const userCount = currentRoom?.size || 0; // 방 현재 참가자 수
            if(userCount === 0){
                await removeRoom(roomId); // 방 삭제 Service
                room.emit('removeRoom', roomId); // 방 삭제 클라이언트에도 보내줘서 화면에서 방 삭제되게
                console.log('방 제거 요청 성공');
            } else {
                // 방에서 나갔다고 알려주기
                socket.to(roomId).emit('exit', {
                    user: 'system',
                    chat: `${socket.request.session.color}님이 퇴장하셨습니다.`,
                });
            }
        })
    });
}