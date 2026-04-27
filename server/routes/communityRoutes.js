const express = require("express");
const {
  getCommunityPosts,
  createCommunityPost,
  likeCommunityPost,
  getCommunityComments,
  createCommunityComment,
} = require("../controllers/communityController");

const router = express.Router();

router.get("/posts", getCommunityPosts);
router.post("/posts", createCommunityPost);
router.post("/posts/:id/like", likeCommunityPost);
router.get("/posts/:id/comments", getCommunityComments);
router.post("/posts/:id/comments", createCommunityComment);

module.exports = router;

