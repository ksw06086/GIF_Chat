const WebSocket = require('ws');

// 서버
module.exports = (server) => {
    // 웹소켓과 익스프레스 서버가 연결됨
    const wss = new WebSocket.Server({ server });

    // 웹 소켓 연결 맺을 때 처음 한번은 클라이언트에서 연결을 맺어주어야 함
    wss.on('connection', (ws, req) => {
        // 클라이언트의 ip주소 가져오기
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log('새로운 클라이언트 접속', ip);
        ws.on('message', (message) => {
            console.log(message.toString());
        })
        ws.on('error', console.error);
        ws.on('close', () => { // 연결이 끊어졌으면 3초마다 보내는 것 중단함
            console.log('클라이언트 접속 해제', ip);
            clearInterval(ws.interval); 
        })

        // 3초마다 클라이언트로 실시간 전송함        
        ws.interval = setInterval(() => {
            // readyState가 오픈상태일 때(처음 맺고 보냈을 때 안 열린 상황일수도 있다.)
            // readyState 상태 : OPEN, CONNECTING, CLOSING, CLOSED 4가지 있음, OPEN 제외 상태에서는 통신불가
            if(ws.readyState === ws.OPEN){
                ws.send('서버에서 클라이언트로 메시지를 보냅니다.');
            }
        }, 3000);
    });
}