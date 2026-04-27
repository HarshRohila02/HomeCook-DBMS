const { pool } = require("../db");

function toInitials(fullName) {
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

async function getCommunityPosts(req, res) {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.image_url,
        p.caption,
        p.like_count,
        p.comment_count,
        p.created_at,
        u.full_name,
        u.avatar_url
      FROM community_posts p
      INNER JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      `,
    );

    return res.json(
      rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        author: row.full_name,
        profile_image: row.avatar_url,
        profile_placeholder: toInitials(row.full_name),
        image_url: row.image_url,
        caption: row.caption,
        like_count: Number(row.like_count ?? 0),
        comment_count: Number(row.comment_count ?? 0),
        created_at: row.created_at,
      })),
    );
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch community posts",
      error: error?.message ?? String(error),
    });
  }
}

async function createCommunityPost(req, res) {
  const { user_id, caption, image_url } = req.body;

  if (!user_id || !caption?.trim()) {
    return res.status(400).json({ message: "user_id and caption are required" });
  }

  try {
    const [result] = await pool.query(
      `
      INSERT INTO community_posts (user_id, image_url, caption, like_count, comment_count)
      VALUES (?, ?, ?, 0, 0)
      `,
      [user_id, image_url?.trim() || null, caption.trim()],
    );

    const [[created]] = await pool.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.image_url,
        p.caption,
        p.like_count,
        p.comment_count,
        p.created_at,
        u.full_name,
        u.avatar_url
      FROM community_posts p
      INNER JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
      `,
      [result.insertId],
    );

    return res.status(201).json({
      id: created.id,
      user_id: created.user_id,
      author: created.full_name,
      profile_image: created.avatar_url,
      profile_placeholder: toInitials(created.full_name),
      image_url: created.image_url,
      caption: created.caption,
      like_count: Number(created.like_count ?? 0),
      comment_count: Number(created.comment_count ?? 0),
      created_at: created.created_at,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create post",
      error: error?.message ?? String(error),
    });
  }
}

async function likeCommunityPost(req, res) {
  const postId = Number(req.params.id);
  const action = req.body?.action === "unlike" ? "unlike" : "like";

  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ message: "Invalid post id" });
  }

  try {
    const delta = action === "unlike" ? -1 : 1;
    await pool.query(
      `
      UPDATE community_posts
      SET like_count = GREATEST(0, like_count + ?)
      WHERE id = ?
      `,
      [delta, postId],
    );

    const [[row]] = await pool.query(
      `SELECT id, like_count FROM community_posts WHERE id = ?`,
      [postId],
    );

    if (!row) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json({
      message: "Like count updated",
      id: row.id,
      like_count: Number(row.like_count ?? 0),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update like count",
      error: error?.message ?? String(error),
    });
  }
}

async function getCommunityComments(req, res) {
  const postId = Number(req.params.id);

  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ message: "Invalid post id" });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        c.id,
        c.post_id,
        c.user_id,
        c.comment_text,
        c.created_at,
        u.full_name,
        u.avatar_url
      FROM community_comments c
      INNER JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
      `,
      [postId],
    );

    return res.json(
      rows.map((row) => ({
        id: row.id,
        post_id: row.post_id,
        user_id: row.user_id,
        author: row.full_name,
        profile_image: row.avatar_url,
        profile_placeholder: toInitials(row.full_name),
        comment_text: row.comment_text,
        created_at: row.created_at,
      })),
    );
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch comments",
      error: error?.message ?? String(error),
    });
  }
}

async function createCommunityComment(req, res) {
  const postId = Number(req.params.id);
  const { user_id, comment_text } = req.body;

  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ message: "Invalid post id" });
  }
  if (!user_id || !comment_text?.trim()) {
    return res.status(400).json({ message: "user_id and comment_text are required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [insertResult] = await connection.query(
      `
      INSERT INTO community_comments (post_id, user_id, comment_text)
      VALUES (?, ?, ?)
      `,
      [postId, user_id, comment_text.trim()],
    );

    await connection.query(
      `
      UPDATE community_posts
      SET comment_count = comment_count + 1
      WHERE id = ?
      `,
      [postId],
    );

    const [[created]] = await connection.query(
      `
      SELECT
        c.id,
        c.post_id,
        c.user_id,
        c.comment_text,
        c.created_at,
        u.full_name,
        u.avatar_url
      FROM community_comments c
      INNER JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
      `,
      [insertResult.insertId],
    );

    const [[post]] = await connection.query(
      `SELECT id, comment_count FROM community_posts WHERE id = ?`,
      [postId],
    );

    await connection.commit();

    return res.status(201).json({
      comment: {
        id: created.id,
        post_id: created.post_id,
        user_id: created.user_id,
        author: created.full_name,
        profile_image: created.avatar_url,
        profile_placeholder: toInitials(created.full_name),
        comment_text: created.comment_text,
        created_at: created.created_at,
      },
      post_comment_count: Number(post?.comment_count ?? 0),
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      message: "Failed to add comment",
      error: error?.message ?? String(error),
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  getCommunityPosts,
  createCommunityPost,
  likeCommunityPost,
  getCommunityComments,
  createCommunityComment,
};

