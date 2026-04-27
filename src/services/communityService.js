import { communityPosts } from '../data/communityData'

const COMMUNITY_API_BASE = 'http://localhost:5000/api/community'

function getTimeAgoLabel(dateValue) {
  if (!dateValue) return 'Just now'
  const then = new Date(dateValue).getTime()
  const now = Date.now()
  const diffMs = Math.max(0, now - then)
  const minutes = Math.floor(diffMs / (1000 * 60))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return `${days} days ago`
}

function mapPost(post) {
  return {
    id: post.id,
    userId: post.user_id ?? 1,
    author: post.author ?? 'Unknown User',
    timeAgo: post.timeAgo ?? getTimeAgoLabel(post.created_at),
    profileImage: post.profile_placeholder ?? 'U',
    imageUrl: post.image_url ?? post.imageUrl ?? '',
    caption: post.caption ?? '',
    likes: Number(post.like_count ?? post.likes ?? 0),
    comments: Number(post.comment_count ?? post.comments ?? 0),
    liked: false,
  }
}

export async function getCommunityPosts() {
  try {
    const response = await fetch(`${COMMUNITY_API_BASE}/posts`)
    if (!response.ok) throw new Error(`Failed to fetch posts: ${response.status}`)
    const rows = await response.json()
    return rows.map(mapPost)
  } catch {
    return communityPosts
  }
}

export async function createCommunityPost(payload) {
  const response = await fetch(`${COMMUNITY_API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Failed to create post: ${response.status}`)
  }
  const row = await response.json()
  return mapPost(row)
}

export async function likeCommunityPost(postId, action = 'like') {
  const response = await fetch(`${COMMUNITY_API_BASE}/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update like: ${response.status}`)
  }
  return response.json()
}

export async function getCommunityComments(postId) {
  const response = await fetch(`${COMMUNITY_API_BASE}/posts/${postId}/comments`)
  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.status}`)
  }
  const rows = await response.json()
  return rows.map((row) => ({
    id: row.id,
    author: row.author ?? 'Unknown User',
    profileImage: row.profile_placeholder ?? 'U',
    commentText: row.comment_text,
    createdAt: row.created_at,
  }))
}

export async function createCommunityComment(postId, payload) {
  const response = await fetch(`${COMMUNITY_API_BASE}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Failed to add comment: ${response.status}`)
  }
  const result = await response.json()
  return {
    comment: {
      id: result.comment.id,
      author: result.comment.author ?? 'Unknown User',
      profileImage: result.comment.profile_placeholder ?? 'U',
      commentText: result.comment.comment_text,
      createdAt: result.comment.created_at,
    },
    postCommentCount: Number(result.post_comment_count ?? 0),
  }
}