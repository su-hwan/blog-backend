/* 로그인 유저인지 점검, model/user 의 generateToken 메서드에서 state */
const checkLoggedIn = (ctx, next) => {
  const { user } = ctx.state;
  console.log('checkLoggedIn');
  if (!user) {
    ctx.status = 401; //Unauthorized
    console.log('checkLoggedIn status 401');
    return;
  }
  return next();
};

export default checkLoggedIn;
