const SocketIO = require('socket.io');

// 서버
module.exports = (server) => {
    // 웹소켓과 익스프레스 서버가 연결됨
    const io = SocketIO(server, { path: '/socket.io' });

    // 웹 소켓 연결 맺을 때 처음 한번은 클라이언트에서 연결을 맺어주어야 함
    io.on('connection', (socket) => {
        const req = socket.request;
        // 클라이언트의 ip주소 가져오기
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log('새로운 클라이언트 접속', ip, socket.id, req.ip); // socket.id 특정인과 연결, 연결끊기 가능(연결에 id가 붙여있는 느낌)

        // 소켓 해제
        socket.on('disconnect', () => {
            console.log('클라이언트 접속 해제', ip, socket.id);
            clearInterval(socket.interval); 
        })
        // 응답 받기 
        socket.on('reply', (data) => {
            console.log(data);
        })
        socket.on('error', console.error);
        // 3초마다 클라이언트로 실시간 전송함        
        socket.interval = setInterval(() => {
            socket.emit('news', 'Hello Socket.IO');
        }, 3000);
    });
}