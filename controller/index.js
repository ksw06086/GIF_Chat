const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

exports.renderMain = async (req, res, next) => {
    try {
        const rooms = await Room.find({});
        res.render('main', { rooms, title: 'GIF 채팅방'});
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.renderRoom = async (req, res, next) => {
    res.render('room', { title: 'GIF 채팅방 생성' });
};

exports.createRoom = async (req, res, next) => {
    try {
        const newRoom = await Room.create({
            title: req.body.title,
            max: req.body.max,
            owner: req.session.color,
            password: req.body.password
        });
        const io = req.app.get('io');
        io.of('/room').emit('newRoom', newRoom); // 브라우저에서 새로운 방 생성됨(방생성 자바스크립트 실행됨)
        // 방에 들어가는 부분
        if(req.body.password){
            res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
        } else {
            res.redirect(`/room/${newRoom._id}`);
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// 방에 들어감
exports.enterRoom = async (req, res, next) => {
    try {
        const room = await Room.findOne({ _id: req.params.id });
        if(!room){
            return res.redirect('/?error=존재하지 않는 방입니다.');
        }
        if(room.password && room.password !== req.query.password) {
            return res.redirect('/?error=비밀번호가 틀렸습니다.');
        }
        // 최대 인원수를 넘어섰는지 확인(소켓 연결 수를 보면 됨)
        const io = req.app.get('io');
        const { rooms } = io.of('/chat').adapter;
        if(room.max <= rooms.get(req.params.id)?.size){ // 실제 방의 참가자 인원이 정원을 초과했는지?
            return res.redirect('/?error=허용 인원을 초과했습니다.');
        }
        res.render('chat', { title: 'GIF 채팅방 생성', chats: [], user: req.session.color });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
exports.removeRoom = async (req, res, next) => {
    try {
        await Room.remove({ _id: req.params.id });
        await Chat.remove({ room: req.params.id });
        res.send('ok');
    } catch (error) {
        console.error(error);
        next(error);
    }
};