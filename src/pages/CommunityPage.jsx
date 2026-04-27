import { useEffect, useMemo, useState } from 'react'
import Button from '../components/shared/Button'
import Card from '../components/shared/Card'
import EmptyState from '../components/shared/EmptyState'
import Modal from '../components/shared/Modal'
import SearchBar from '../components/shared/SearchBar'
import {
  createCommunityComment,
  createCommunityPost,
  getCommunityComments,
  getCommunityPosts,
  likeCommunityPost,
} from '../services/communityService'

function CommunityPage() {
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState([])
  const [isNewPostOpen, setIsNewPostOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [commentsByPost, setCommentsByPost] = useState({})
  const [openCommentsByPost, setOpenCommentsByPost] = useState({})
  const [commentInputByPost, setCommentInputByPost] = useState({})

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await getCommunityPosts()
        setPosts(data)
      } catch {
        setErrorMessage('Could not load community feed.')
      } finally {
        setIsLoading(false)
      }
    }
    loadPosts()
  }, [])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) =>
      `${post.author} ${post.caption}`.toLowerCase().includes(query.toLowerCase()),
    )
  }, [posts, query])

  function toggleLike(postId) {
    const currentPost = posts.find((item) => item.id === postId)
    if (!currentPost) return
    const nextLiked = !currentPost.liked

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: nextLiked,
              likes: nextLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
            }
          : post,
      ),
    )

    likeCommunityPost(postId, nextLiked ? 'like' : 'unlike')
      .then((result) => {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, likes: Number(result.like_count ?? post.likes) } : post,
          ),
        )
      })
      .catch(() => {
        // keep local fallback state
      })
  }

  function toggleComments(postId) {
    setOpenCommentsByPost((prev) => ({ ...prev, [postId]: !prev[postId] }))
    if (commentsByPost[postId]) return

    getCommunityComments(postId)
      .then((comments) => {
        setCommentsByPost((prev) => ({ ...prev, [postId]: comments }))
      })
      .catch(() => {
        setCommentsByPost((prev) => ({ ...prev, [postId]: [] }))
      })
  }

  async function submitComment(event, postId) {
    event.preventDefault()
    const text = (commentInputByPost[postId] ?? '').trim()
    if (!text) return

    try {
      const result = await createCommunityComment(postId, {
        user_id: 1,
        comment_text: text,
      })
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), result.comment],
      }))
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, comments: result.postCommentCount } : post,
        ),
      )
    } catch {
      const fallbackComment = {
        id: Date.now(),
        author: 'Harsh Rohila',
        profileImage: 'HR',
        commentText: text,
        createdAt: new Date().toISOString(),
      }
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), fallbackComment],
      }))
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, comments: post.comments + 1 } : post,
        ),
      )
    }

    setCommentInputByPost((prev) => ({ ...prev, [postId]: '' }))
  }

  function openNewPostModal() {
    setImageUrl('')
    setCaption('')
    setIsNewPostOpen(true)
  }

  async function submitNewPost(event) {
    event.preventDefault()
    const text = caption.trim()
    if (!text) return

    try {
      const createdPost = await createCommunityPost({
        user_id: 1,
        caption: text,
        image_url: imageUrl.trim(),
      })
      setPosts((prev) => [createdPost, ...prev])
      setIsNewPostOpen(false)
      return
    } catch {
      // fallback local post below
    }

    const newPost = {
      id: Date.now(),
      userId: 1,
      author: 'Harsh Rohila',
      timeAgo: 'Just now',
      profileImage: 'HR',
      imageUrl: imageUrl.trim(),
      caption: text,
      likes: 0,
      comments: 0,
      liked: false,
    }
    setPosts((prev) => [newPost, ...prev])
    setIsNewPostOpen(false)
  }

  return (
    <div className="page-content community-page">
      <section className="community-header">
        <div className="community-header-row">
          <span className="community-back">←</span>
          <h2>Community</h2>
        </div>
      </section>

      <SearchBar value={query} onChange={setQuery} placeholder="Search posts" />

      {errorMessage ? <p className="header-meta">{errorMessage}</p> : null}

      {isLoading ? (
        <Card title="Community">Loading feed...</Card>
      ) : (
        <div className="community-feed">
          {filteredPosts.map((post) => (
            <Card key={post.id}>
              <div className="post-head">
                <div className="post-user">
                  <div className="post-avatar">{post.profileImage}</div>
                  <div>
                    <strong>{post.author}</strong>
                    <p>{post.timeAgo}</p>
                  </div>
                </div>
                <button type="button" className="post-menu-btn">
                  ⋯
                </button>
              </div>

              <div className="post-image">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt="Post" />
                ) : (
                  <div className="post-image-placeholder">Post image</div>
                )}
              </div>

              <p className="post-caption">{post.caption}</p>

              <div className="post-actions">
                <button
                  type="button"
                  className={`post-action-btn${post.liked ? ' liked' : ''}`}
                  onClick={() => toggleLike(post.id)}
                >
                  👍 Like
                </button>
                <span>{post.likes}</span>
                <button
                  type="button"
                  className="post-action-btn"
                  onClick={() => toggleComments(post.id)}
                >
                  💬 Comment
                </button>
                <span>{post.comments}</span>
              </div>

              {openCommentsByPost[post.id] ? (
                <div className="post-comments">
                  {(commentsByPost[post.id] ?? []).map((comment) => (
                    <div className="post-comment-item" key={comment.id}>
                      <strong>{comment.author}:</strong> {comment.commentText}
                    </div>
                  ))}
                  <form
                    className="post-comment-form"
                    onSubmit={(event) => submitComment(event, post.id)}
                  >
                    <input
                      value={commentInputByPost[post.id] ?? ''}
                      onChange={(event) =>
                        setCommentInputByPost((prev) => ({
                          ...prev,
                          [post.id]: event.target.value,
                        }))
                      }
                      placeholder="Add a comment..."
                    />
                    <Button type="submit" variant="ghost">
                      Post
                    </Button>
                  </form>
                </div>
              ) : null}
            </Card>
          ))}
          {!filteredPosts.length ? (
            <EmptyState
              title="No posts found"
              description="Try a different search or create a new post."
            />
          ) : null}
        </div>
      )}

      <Button className="community-new-desktop" onClick={openNewPostModal}>
        + New Post
      </Button>

      <button
        type="button"
        className="community-fab"
        onClick={openNewPostModal}
        aria-label="Create new post"
      >
        + New
      </button>

      <Modal isOpen={isNewPostOpen} title="Create New Post" onClose={() => setIsNewPostOpen(false)}>
        <form className="review-form" onSubmit={submitNewPost}>
          <label htmlFor="community-user">User</label>
          <input id="community-user" value="Harsh Rohila" disabled />

          <label htmlFor="community-image-url">Image URL</label>
          <input
            id="community-image-url"
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://example.com/post-image.jpg"
          />

          <label htmlFor="community-caption">Caption</label>
          <textarea
            id="community-caption"
            rows="3"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Write your campus update..."
            required
          />

          <div className="review-submit">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default CommunityPage