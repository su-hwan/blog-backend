// const Router = require('koa-router');
// const postsCtrl = require('./posts.ctrl');
import Router from 'koa-router';
import * as postsCtrl from './posts.ctrl';
import checkLoggedIn from '../../lib/checkLoggedIn';

const posts = new Router();
posts.get('/', postsCtrl.list);
posts.post('/', checkLoggedIn, postsCtrl.write);

const post = new Router();
post.get('/', postsCtrl.read);
post.delete('/', checkLoggedIn, postsCtrl.checkOnePost, postsCtrl.remove);
post.patch('/', checkLoggedIn, postsCtrl.checkOnePost, postsCtrl.update);

posts.use('/:id', postsCtrl.getPostById, post.routes());

// module.exports = posts;
export default posts;
