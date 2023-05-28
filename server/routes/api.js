var express = require('express');
var router = express.Router();

const auth = require('../controller/auth.js');
const db = require('../config/db.js');
const sess = require('../controller/sessionChecker.js');
const emailAuth=require('../controller/emailAuth.js');


// 회원 가입 요청 처리
// 리액트에서는 이후에 email 인증코드 확인하는 페이지로 연결해주어야함!!
router.post('/signup', (req, res) => {
  const { id, name, email, password } = req.body;
  const user = { id, name, email, password };
  console.log(user)
  if (!auth.isValidInput(user)) { // 서버에서 입력 폼의 데이터 검사
    console.log('user: ', req.body.id + ' - sign up fail: invalid input data');
    res.json({ result: 'fail', msg: "유효하지 않은 입력입니다." });
  }
  db.query('SELECT * FROM User WHERE id=?', [id], (err, idData) => {
    if(err){ throw err; }
    if (idData.length == 0) { // DB에 해당 id에 대한 정보가 없을 경우
      db.query('SELECT * FROM User WHERE email=?', [email], (err, mailData) => { // DB에 해당 email 정보있는지 검색
        if (err) { throw err; }
        if (mailData.length == 0) { //DB에 해당 email에 대한 정보 없는 경우 -> 가입 진행
          // 이메일 인증 절차
          req.session.usrEmail = user.email;
          req.session.user = user; // post(/signupAuth)에서 db에 정보 넣기 위해 세션에 user 정보 저장...
          emailAuth.emailAuthentication(req, res);
        }else{ // 이미 사용중인 email인 경우
          console.log('user: ', req.body.email + ' - sign up fail: email already exist')
          res.json({result:'fail',msg:"이미 사용중인 이메일 입니다."});
        }
      })
    } else { // DB에 중복된 id가 있을 경우
      console.log('user: ', req.body.id + ' - sign up fail: ID already exist');
      res.json({ result: 'fail', msg: "이미 사용중인 ID 입니다." });
    }
  })
});

router.post('/signupAuth',(req,res)=>{
  const usrInput = Number(req.body.authCode);
  console.log("usr Input: " + usrInput + ", session value: " + req.session.authCode);
  if (usrInput === req.session.authCode) { // 인증코드 일치하는 경우, 회원가입 처리
    db.query('INSERT INTO User SET ?', req.session.user, (err, result) => {
      if (err) {
        throw err;
      }
    })
    console.log('user: ', req.session.user.id + ' - sign up success');
    delete req.session.user; // db에 입력하기 위해 임시로 저장한 req.session.user 삭제
    res.json({result:"success",msg:"회원가입에 성공했습니다."});
  } else { // 인증코드 불일치
    res.json({result:'fail',msg:'인증코드가 일치하지 않습니다.'})
  }
})

// 로그인 요청 처리
router.post('/login', (req, res) => {
  const id = req.body.id;
  const pw = req.body.password;
  db.query('SELECT * FROM User WHERE id=? AND password=?', [id, pw], (err, result) => {
    if (err) {
      throw err;
    }
    if (result.length != 0) { // 결과 존재하는 경우
      console.log('user: ', id + ' - login success');
      req.session.isLogined = true;
      req.session.userId = req.body.id;
      res.json({ result: 'success', msg: "로그인에 성공했습니다." });
    } else { // 존재하지 않는 경우
      console.log('user: ', id + ' - login fail: No such ID or PW');
      res.json({ result: 'fail', msg: "아이디 또는 비밀번호가 일치하지 않습니다." });
    }
  })
})

// 로그아웃 요청 처리
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.json({result:'success'});
})

module.exports = router;
