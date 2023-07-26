import mongoose, { Schema } from 'mongoose';

const PostSchema = new Schema({
  title: String,
  body: String,
  tags: [String], //문자배열
  publishedDate: {
    type: Date,
    default: Date.now, //기본값(현재날짜)
  },
  user: {
    _id: mongoose.Types.ObjectId,
    username: String,
  },
});

const Post = mongoose.model('Post', PostSchema);

export default Post;
