const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const ColorHash = require('color-hash').default; // 어떤 값을 컬러로 바꾸어줌 

dotenv.config();
const webSocket = require('./socket');
const indexRouter = require('./routes');
const connect = require('./schemas');

const app = express();
app.set('port', process.env.PORT || 8005);
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});
connect();

// 소켓에서 사용해야해서 분리시킴(시스템 메시지 등)
const sessionMiddleware = session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
});
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/gif', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);

// user 테이블이 따로 없음
// session을 통해서 ID를 만들어낼 것
app.use((req, res, next) => {
  // 여기서 만든 컬러가 채팅방 각각 채팅의 글자색이 될 것임
  if(!req.session.color){ // 세션 값이 없는 경우에만 
    const colorHash = new ColorHash();
    req.session.color = colorHash.hex(req.sessionID); // 해당 사람이 컬러가 됨
    console.log(req.session.color, req.sessionID);
  }
  next();
});

app.use('/', indexRouter);

app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// 여기서 가져온 서버를 웹소켓과 연결
const server = app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
})

// 앱을 넘기는 이유는 세션에 접근하기 위해서 색을 추출하기 위해
webSocket(server, app, sessionMiddleware);


