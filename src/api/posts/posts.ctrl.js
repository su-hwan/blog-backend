import Post from '../../models/post';
import { Types } from 'mongoose';
import Joi from 'joi';
import sanitizeHtml from 'sanitize-html';

const sanitizeOption = {
  allowedTags: [
    'h1',
    'h2',
    'b',
    'i',
    'u',
    's',
    'p',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src'],
    li: ['class'],
  },
  allowedSchemas: ['data', 'http'],
};

//html을 없애고 내용이 너무 길면 200자로 제한하는 함수
const removeHtmlAndShorten = (body) => {
  const filtered = sanitizeHtml(body, {
    allowedTags: [], //허용 tag
  });
  return filtered.length < 200 ? filtered : `${filtered.slice(0, 200)}...`;
};

/* 포스트 작성
POST /api/posts
{title, body, tags:[tag1, tag2]}
*/
export const write = async (ctx) => {
  console.log('write route:/posts');
  const schema = Joi.object().keys({
    // 객체가 다음 필드를 가지고 있음을 검증
    title: Joi.string().required(), // required() 가 있으면 필수 항목
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(), // 문자열로 이루어진 배열
  });

  // 검증 후, 검증 실패시 에러처리
  const result = schema.validate(ctx.request.body); //Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 400; // Bad Request
    ctx.body = result.error;
    return;
  }

  //REST API의 Request Body는 ctx.request.body에서 조회
  const { title, body, tags } = ctx.request.body;
  const post = new Post({
    title,
    body: sanitizeHtml(body, sanitizeOption),
    tags,
    user: ctx.state.user,
  });
  try {
    await post.save();
    console.log('/posts post.save : ', post);
    ctx.body = post;
  } catch (e) {
    console.log('/posts error: ', e);
    ctx.throw(500, e);
  }
};

/* 포스트 목록 조회
GET /api/posts
*/
export const list = async (ctx) => {
  const page = parseInt(ctx.query.page || '1', 10);
  if (page < 1) {
    ctx.status = 400;
    return;
  }

  try {
    const { username, tag } = ctx.query;
    // GET /api/posts?username=&tag=&
    const query = {
      ...(username ? { 'user.username': username } : {}),
      ...(tag ? { tags: [tag] } : {}),
    };
    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(10)
      .skip((page - 1) * 10)
      .lean() //Json 형태로 변환
      .exec();
    //Posts 컬렉션의 전체 건수
    const postCount = await Post.countDocuments().exec();
    ctx.set('Last-page', Math.ceil(postCount / 10));
    ctx.body = posts
      //.map((post) => post.toJSON()) //위에서 lean()호출했으므로 제외
      .map((post) => ({
        ...post,
        body: removeHtmlAndShorten(post.body),
      }));
  } catch (e) {
    ctx.throw(500, e);
  }
};

/* 특정 포스트 조회
GET /api/posts/:id
*/
export const read = async (ctx) => {
  // const { id } = ctx.params;
  // try {
  //   const post = await Post.findById(id).exec();
  //   if (!post) {
  //     ctx.status = 404;
  //     return;
  //   }
  //   console.log('_post__:', post);
  //   ctx.body = post;
  // } catch (e) {
  //   ctx.throw(500, e);
  // }
  ctx.body = ctx.state.post;
};

/* 특정 포스트 제거
DELETE /api/posts/:id
*/
export const remove = async (ctx) => {
  const { id } = ctx.params;
  try {
    const post = await Post.findByIdAndDelete(id).exec();
    if (!post) {
      ctx.status = 404;
      return;
    }
    console.log('_post__:', post);
    ctx.status = 204; //No content
  } catch (e) {
    ctx.throw(500, e);
  }
};

/* 특정 포스트 수정
PUT /api/posts/:id
{title, body}
*/
// export const replace = (ctx) => {
// };

/* 특정 포스트의 특정 항목만 수정
PATCH /api/posts/:id
{title, body}
*/
export const update = async (ctx) => {
  const { id } = ctx.params;
  console.log('update _id:', id);

  // const schema = Joi.object().keys({
  //   // 객체가 다음 필드를 가지고 있음을 검증
  //   title: Joi.string(), // required() 가 있으면 필수 항목
  //   body: Joi.string(),
  //   tags: Joi.array().items(Joi.string()), // 문자열로 이루어진 배열
  // });

  // // 검증 후, 검증 실패시 에러처리
  // const result = schema.validate(ctx.request.body);
  // if (result.error) {
  //   ctx.status = 400; // Bad Request
  //   ctx.body = result.error;
  //   return;
  // }

  const nextData = { ...ctx.request.body };
  //body값이 주어졌으면 HTML 필터링
  if (nextData.body) {
    nextData.body = sanitizeHtml(nextData.body);
  }
  try {
    const post = await Post.findByIdAndUpdate(id, nextData, {
      new: true, //이 값을 설정하면 업데이트 데이터 반환, false 이전 데이터
    }).exec();
    if (!post) {
      ctx.status = 404;
      return;
    }
    console.log('_post__:', post);
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

const { ObjectId } = Types;
export const checkObjectId = (ctx, next) => {
  const { id } = ctx.params;
  if (!ObjectId.isValid(id)) {
    ctx.status = 400; //Bad Request
    return;
  }
  return next();
};

/* Middleware
   post에 id가 존재하는지 검증
*/
export const getPostById = async (ctx, next) => {
  const { id } = ctx.params;
  if (!ObjectId.isValid(id)) {
    ctx.status = 400; //Bad Request
    return;
  }
  try {
    const post = await Post.findById(id);
    if (!post) {
      ctx.status = 401; //Unauthorized
      return;
    }
    ctx.state.post = post;
    return next();
  } catch (e) {
    ctx.throw(500, e);
  }
};

/* Middleware
  post글과 로그인 유저가 동일한지 검증
  */
export const checkOnePost = (ctx, next) => {
  const { post, user } = ctx.state;
  if (!post.user._id || user._id !== post.user._id.toString()) {
    ctx.status = 403; //Forbidden
    return;
  }

  return next();
};
