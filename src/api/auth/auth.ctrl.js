import Joi from 'joi';
import User from '../../models/user';

//회원가입
/*
POST /register
{username: 'velopert', password: 'mypass123'}
*/
export const register = async (ctx) => {
  const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string().required(),
  });
  const result = schema.validate(ctx.request.body);
  if (!result) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }
  const { username, password } = ctx.request.body;

  try {
    const exists = await User.findByUsername(username);
    if (exists) {
      ctx.status = 409; //Conflict
      return;
    }
    const user = new User({
      username: username,
    });
    await user.setPassword(password);
    await user.save();

    //응답할 데이터에서 password 제거
    ctx.body = user.serialize();
  } catch (error) {
    ctx.status = 500;
    throw error;
  }
};

//로그인
/*
POST /login
{username: 'velopert', password: 'mypass123'}
*/
export const login = async (ctx) => {
  const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string().required(),
  });
  const result = schema.validate(ctx.request.body);
  if (!result) {
    ctx.status = 400; //Unauthorized
    ctx.body = result.error;
    return;
  }
  const { username, password } = ctx.request.body;

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401; //Unauthorized
      return;
    }
    const checkPass = await user.checkPassword(password);
    if (!checkPass) {
      ctx.status = 401; //Unauthorized
      return;
    }

    //응답할 데이터에서 password 제거
    ctx.body = user.serialize();

    //jwt 생성(token)
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, //토큰 만료일자 X, 쿠키만료일자 임
      httpOnly: true,
    });
  } catch (error) {
    ctx.throw(500, error);
  }
};

//로그인 상태 확인
export const check = async (ctx) => {
  const { user } = ctx.state; //jwtMiddleware에서 ctx.state.user 세팅 됨
  if (!user) {
    ctx.status = 401; //Unauthorized
    return;
  }
  ctx.body = user;
};

//로그 아웃
/*
POST /api/auth/logout
*/
export const logout = async (ctx) => {
  const { user } = ctx.state;
  if (user) {
    ctx.cookies.set('access_token');
  }
  ctx.status = 204; //No content
};
