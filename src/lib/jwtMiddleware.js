import jwt from 'jsonwebtoken';
import User from '../models/user';

const jwtMiddleware = async (ctx, next) => {
  //auth.ctrl.js login 펑션에 token cookies의 키를 'access_token'로 정의함
  const token = ctx.cookies.get('access_token');
  if (!token) return next(); //token 없음
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('decoded:', decoded);
    ctx.state.user = {
      _id: decoded._id,
      username: decoded.username,
    };
    /* 토큰 만료일이 3.5일보다 작으면 새로 쿠키 생성 */
    const now = Math.floor(Date.now() / 1000);
    // console.log(
    //   `now: ${new Date(now * 1000)} \r\n`,
    //   `exp: ${new Date(decoded.exp * 1000)}`,
    // );
    if (decoded.exp - now < 60 * 60 * 24 * 3.5) {
      const user = await User.findById(decoded._id);
      console.log(user);
      const token = user.generateToken();
      await ctx.cookies.set('access_token', token, {
        maxAge: 1000 * 60 * 60 * 24 * 7, //token의 만료일자 X, 쿠키만료일자 임
        httpOnly: true,
      });

      // const decoded2 = jwt.verify(token, process.env.JWT_SECRET);
      // console.log('decoded2:', decoded2);
      // console.log('new token:', new Date(decoded2.exp * 1000));
    }

    return next();
  } catch (error) {
    //token 검증 실패
    return next();
  }
};

export default jwtMiddleware;
