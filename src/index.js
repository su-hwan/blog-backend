// require('dotenv').config();
// const Koa = require('koa');
// const Router = require('koa-router');
// const api = require('./api/index');
// const bodyParser = require('koa-bodyparser');
// const mongoose = require('mongoose');

import dotenv from 'dotenv';
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import mongoose from 'mongoose';
import serve from 'koa-static';
import path from 'path';
import send from 'koa-send';
import api from './api';
import jwtMiddleware from './lib/jwtMiddleware';
// import checkLoggedIn from './lib/checkLoggedIn';
// import createFakeData from './createFakeData'; //Test용 데이터 생성

dotenv.config();

//비구조화 할당을 통해 process.env 내부 값에 대한 레퍼런스 만들기
const { PORT, MONGO_URI } = process.env;

const app = new Koa();
const router = new Router();

mongoose
  .connect(
    MONGO_URI,
    //mongo6 환경에서 아래 설정시 오류
    // {
    // useNewUrlParser: true,
    // useFindAndModify: false,
    // }
  )
  .then(() => {
    console.log('Connected to MongoDB');
    //Test용 데이터 생성
    //createFakeData();
  })
  .catch((e) => {
    console.error(e);
  });

/** ★★★★ */
router.use('/api', api.routes());

app.use(bodyParser()); //클라이언트에서 받은 json방식의 데이터를 쉽게 사용할수 있도록 함
app.use(jwtMiddleware);

//app 인스턴스에 라우터 적용
app.use(router.routes()).use(router.allowedMethods());
const buildDirectory = path.resolve(__dirname, '../../blog-frontend/build');
app.use(serve(buildDirectory));
app.use(async (ctx) => {
  //Not found 이고 주소가 /api로 시작하지 않는 경우
  if (ctx.status === 404 && ctx.path.indexOf('/api') !== 0) {
    //index.html 내용을 반환
    await send(ctx, 'index.html', { root: buildDirectory });
  }
});

//PORT 가 지정되지 않았다면 4000를 사용
const port = PORT || 4000;
app.listen(port, () => {
  console.log('Listening to port %d', port);
});
