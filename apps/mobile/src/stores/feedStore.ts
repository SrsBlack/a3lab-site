import { create } from 'zustand';

export type ContentType = 'photo' | 'video' | 'text';
export type ReactionType = 'felt_that' | 'respect' | 'real_one';

export interface Reaction {
  type: ReactionType;
  count: number;
  hasReacted: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  isAuthorVerified: boolean;
  contentType: ContentType;
  mediaUrl: string | null;
  textContent: string | null;
  caption: string | null;
  captureMethod: 'captured_on_device' | 'typed_live';
  integrityHash: string;
  reactions: Reaction[];
  createdAt: string;
  flagged: boolean;
}

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  cursor: string | null;
  hasMore: boolean;

  // Actions
  setPosts: (posts: Post[]) => void;
  appendPosts: (posts: Post[], cursor: string | null) => void;
  prependPost: (post: Post) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  toggleReaction: (postId: string, reactionType: ReactionType) => void;
  flagPost: (postId: string) => void;
  clearFeed: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  isLoading: false,
  isRefreshing: false,
  cursor: null,
  hasMore: true,

  setPosts: (posts) => set({ posts }),

  appendPosts: (posts, cursor) =>
    set((state) => ({
      posts: [...state.posts, ...posts],
      cursor,
      hasMore: posts.length > 0,
    })),

  prependPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setRefreshing: (isRefreshing) => set({ isRefreshing }),

  toggleReaction: (postId, reactionType) =>
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          reactions: post.reactions.map((r) => {
            if (r.type !== reactionType) return r;
            return {
              ...r,
              hasReacted: !r.hasReacted,
              count: r.hasReacted ? r.count - 1 : r.count + 1,
            };
          }),
        };
      }),
    })),

  flagPost: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, flagged: true } : post
      ),
    })),

  clearFeed: () =>
    set({ posts: [], cursor: null, hasMore: true }),
}));
