/*
  # Create Speak Decentralized Social Media Schema

  1. New Tables
    - `users`
      - `wallet_address` (text, primary key) - User's Web3 wallet address
      - `username` (text, unique) - Optional username like username.speak.brave
      - `bio` (text) - User bio
      - `avatar_url` (text) - Profile picture URL
      - `encryption_enabled` (boolean, default true) - Privacy preference
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `posts`
      - `id` (uuid, primary key)
      - `wallet_address` (text, foreign key to users)
      - `content` (text) - Post content (may be encrypted)
      - `ipfs_hash` (text) - IPFS content hash
      - `is_encrypted` (boolean, default true)
      - `visibility` (text) - 'public', 'followers', 'private'
      - `likes_count` (integer, default 0)
      - `created_at` (timestamptz, default now())
    
    - `follows`
      - `follower_address` (text, foreign key to users)
      - `following_address` (text, foreign key to users)
      - `created_at` (timestamptz, default now())
      - Primary key on (follower_address, following_address)
    
    - `likes`
      - `wallet_address` (text, foreign key to users)
      - `post_id` (uuid, foreign key to posts)
      - `created_at` (timestamptz, default now())
      - Primary key on (wallet_address, post_id)
  
  2. Security
    - Enable RLS on all tables
    - Users can read all public data
    - Users can only write their own data
    - Privacy-respecting policies for encrypted content
  
  3. Indexes
    - Index on posts.wallet_address for feed queries
    - Index on posts.created_at for chronological sorting
    - Index on follows for relationship queries
*/

CREATE TABLE IF NOT EXISTS users (
  wallet_address text PRIMARY KEY,
  username text UNIQUE,
  bio text DEFAULT '',
  avatar_url text,
  encryption_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  content text NOT NULL,
  ipfs_hash text,
  is_encrypted boolean DEFAULT true,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follows (
  follower_address text NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  following_address text NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_address, following_address),
  CHECK (follower_address != following_address)
);

CREATE TABLE IF NOT EXISTS likes (
  wallet_address text NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (wallet_address, post_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_wallet_address ON posts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_address);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_address);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (wallet_address = current_user)
  WITH CHECK (wallet_address = current_user);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (wallet_address = current_user);

CREATE POLICY "Anyone can view public posts"
  ON posts FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  USING (wallet_address = current_user);

CREATE POLICY "Users can view followers-only posts they follow"
  ON posts FOR SELECT
  USING (
    visibility = 'followers' AND
    EXISTS (
      SELECT 1 FROM follows
      WHERE follows.following_address = posts.wallet_address
      AND follows.follower_address = current_user
    )
  );

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (wallet_address = current_user);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (wallet_address = current_user)
  WITH CHECK (wallet_address = current_user);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (wallet_address = current_user);

CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (follower_address = current_user);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (follower_address = current_user);

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON likes FOR INSERT
  WITH CHECK (wallet_address = current_user);

CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  USING (wallet_address = current_user);
