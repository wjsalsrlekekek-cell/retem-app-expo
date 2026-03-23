import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  PenSquare,
  Heart,
  MessageCircle,
  Send,
  ImagePlus,
  X,
  ChevronDown,
  ChevronUp,
  Globe,
  BadgeCheck,
  Shield,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import * as storage from '../lib/storage';
import { translatePost, translateComment } from '../lib/translate';
import type { Post, Comment, User } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

interface PostWithAuthor extends Post {
  author?: User | null;
}

interface CommentWithAuthor extends Comment {
  author?: User | null;
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Write form state
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Comments state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, CommentWithAuthor[]>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  // Likes state
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Translation state
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  const [showCommentTranslation, setShowCommentTranslation] = useState<Record<string, boolean>>({});

  // Verification modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Image viewer
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const allPosts = await storage.getPosts();
    const sorted = allPosts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const withAuthors: PostWithAuthor[] = await Promise.all(
      sorted.map(async (post) => {
        const author = await storage.getUserById(post.authorId);
        return { ...post, author };
      }),
    );

    setPosts(withAuthors);

    // Load like statuses
    if (user) {
      const likeMap: Record<string, boolean> = {};
      await Promise.all(
        withAuthors.map(async (post) => {
          likeMap[post.id] = await storage.isPostLiked(user.id, post.id);
        }),
      );
      setLikedPosts(likeMap);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [loadPosts]);

  const loadComments = useCallback(async (postId: string) => {
    const comments = await storage.getCommentsByPostId(postId);
    const withAuthors: CommentWithAuthor[] = await Promise.all(
      comments.map(async (c) => {
        const author = await storage.getUserById(c.authorId);
        return { ...c, author };
      }),
    );
    setPostComments((prev) => ({ ...prev, [postId]: withAuthors }));
  }, []);

  const toggleComments = useCallback(
    async (postId: string) => {
      if (expandedPostId === postId) {
        setExpandedPostId(null);
      } else {
        setExpandedPostId(postId);
        await loadComments(postId);
      }
    },
    [expandedPostId, loadComments],
  );

  const handleLike = useCallback(
    async (postId: string) => {
      if (!user) return;
      await storage.togglePostLike(user.id, postId);
      const nowLiked = await storage.isPostLiked(user.id, postId);
      setLikedPosts((prev) => ({ ...prev, [postId]: nowLiked }));

      // Refresh post data
      const allPosts = await storage.getPosts();
      setPosts((prev) =>
        prev.map((p) => {
          const updated = allPosts.find((ap) => ap.id === p.id);
          return updated ? { ...p, likes: updated.likes } : p;
        }),
      );
    },
    [user],
  );

  const handleSubmitPost = useCallback(async () => {
    if (!user) return;
    if (!user.verified) {
      setShowVerifyModal(true);
      return;
    }
    if (!newContent.trim()) return;

    setSubmitting(true);
    const tags = newTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const newPost: Post = {
      id: storage.uuid(),
      authorId: user.id,
      content: newContent.trim(),
      images: newImages,
      tags,
      likes: 0,
      commentsCount: 0,
      language: language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storage.addPost(newPost);
    setNewContent('');
    setNewTags('');
    setNewImages([]);
    setShowWriteForm(false);
    setSubmitting(false);
    showToast(t('community.post_created') || 'Post created!');
    await loadPosts();
  }, [user, newContent, newTags, newImages, language, loadPosts, showToast, t]);

  const handleSubmitComment = useCallback(
    async (postId: string) => {
      if (!user) return;
      if (!user.verified) {
        setShowVerifyModal(true);
        return;
      }
      const text = commentTexts[postId]?.trim();
      if (!text) return;

      const newComment: Comment = {
        id: storage.uuid(),
        postId,
        authorId: user.id,
        content: text,
        createdAt: new Date().toISOString(),
      };

      await storage.addComment(newComment);
      await storage.updatePost(postId, {
        commentsCount: (posts.find((p) => p.id === postId)?.commentsCount ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      });

      setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
      await loadComments(postId);
      await loadPosts();
    },
    [user, commentTexts, posts, loadComments, loadPosts],
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4 - newImages.length,
      quality: 0.7,
    });
    if (!result.canceled) {
      setNewImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 4));
    }
  };

  const togglePostTranslation = useCallback((postId: string) => {
    setShowTranslation((prev) => ({ ...prev, [postId]: !prev[postId] }));
  }, []);

  const toggleCommentTranslation = useCallback((commentId: string) => {
    setShowCommentTranslation((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#10b981', marginBottom: 12 }}>Re;Tem</Text>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>{t('community.title') || 'Community'}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={['#10b981']} />
        }
      >
        {/* Write Prompt */}
        {!showWriteForm && (
          <TouchableOpacity
            style={styles.writePrompt}
            onPress={() => {
              if (!user?.verified) {
                setShowVerifyModal(true);
              } else {
                setShowWriteForm(true);
              }
            }}
          >
            {user && (
              <Image source={{ uri: user.profileImage }} style={styles.writeAvatar} />
            )}
            <Text style={styles.writePromptText}>
              {t('community.write_prompt') || 'Share something with the community...'}
            </Text>
            <PenSquare size={20} color="#10b981" />
          </TouchableOpacity>
        )}

        {/* Write Form */}
        {showWriteForm && (
          <View style={styles.writeForm}>
            <View style={styles.writeFormHeader}>
              <Text style={styles.writeFormTitle}>{t('community.new_post') || 'New Post'}</Text>
              <TouchableOpacity onPress={() => setShowWriteForm(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.writeInput}
              placeholder={t('community.write_placeholder') || 'What\'s on your mind?'}
              placeholderTextColor="#94a3b8"
              multiline
              value={newContent}
              onChangeText={setNewContent}
              textAlignVertical="top"
            />
            <TextInput
              style={styles.tagInput}
              placeholder={t('community.tags_placeholder') || 'Tags (comma separated)'}
              placeholderTextColor="#94a3b8"
              value={newTags}
              onChangeText={setNewTags}
            />

            {/* Image Preview */}
            {newImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow}>
                {newImages.map((uri, idx) => (
                  <View key={idx} style={styles.previewImageContainer}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <X size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.writeActions}>
              <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={pickImage}
                disabled={newImages.length >= 4}
              >
                <ImagePlus size={20} color={newImages.length >= 4 ? '#cbd5e1' : '#10b981'} />
                <Text style={[styles.imagePickerText, newImages.length >= 4 && { color: '#cbd5e1' }]}>
                  {newImages.length}/4
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, (!newContent.trim() || submitting) && styles.submitBtnDisabled]}
                onPress={handleSubmitPost}
                disabled={!newContent.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>{t('community.post') || 'Post'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Posts */}
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>{t('community.empty') || 'No posts yet'}</Text>
            <Text style={styles.emptyDesc}>
              {t('community.empty_desc') || 'Be the first to share with the community'}
            </Text>
          </View>
        ) : (
          posts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            const liked = likedPosts[post.id] ?? false;
            const translatedContent = showTranslation[post.id] ? translatePost(post.id, language) : null;
            const comments = postComments[post.id] || [];

            return (
              <View key={post.id} style={styles.postCard}>
                {/* Author Row */}
                <View style={styles.postAuthorRow}>
                  <Image
                    source={{
                      uri: post.author?.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
                    }}
                    style={styles.postAvatar}
                  />
                  <View style={styles.postAuthorInfo}>
                    <View style={styles.postAuthorNameRow}>
                      <Text style={styles.postAuthorName}>{post.author?.fullName || 'Unknown'}</Text>
                      {post.author?.verified && <BadgeCheck size={14} color="#10b981" />}
                    </View>
                    <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text style={styles.postContent}>{post.content}</Text>

                {/* Translation */}
                {translatedContent && showTranslation[post.id] && (
                  <View style={styles.translationBox}>
                    <Globe size={12} color="#3b82f6" />
                    <Text style={styles.translationText}>{translatedContent}</Text>
                  </View>
                )}

                {post.language !== language && (
                  <TouchableOpacity onPress={() => togglePostTranslation(post.id)} style={styles.translateBtn}>
                    <Globe size={14} color="#3b82f6" />
                    <Text style={styles.translateBtnText}>
                      {showTranslation[post.id]
                        ? t('community.hide_translation') || 'Hide translation'
                        : t('community.translate') || 'Translate'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Tags */}
                {post.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {post.tags.map((tag, idx) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Images */}
                {post.images.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.postImagesRow}>
                    {post.images.map((uri, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setViewerImage(uri)}>
                        <Image source={{ uri }} style={styles.postImage} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Actions */}
                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(post.id)}>
                    <Heart size={18} color={liked ? '#ef4444' : '#94a3b8'} fill={liked ? '#ef4444' : 'none'} />
                    <Text style={[styles.actionText, liked && { color: '#ef4444' }]}>{post.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => toggleComments(post.id)}>
                    <MessageCircle size={18} color="#94a3b8" />
                    <Text style={styles.actionText}>{post.commentsCount}</Text>
                    {isExpanded ? (
                      <ChevronUp size={14} color="#94a3b8" />
                    ) : (
                      <ChevronDown size={14} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Comments Section */}
                {isExpanded && (
                  <View style={styles.commentsSection}>
                    {comments.length === 0 ? (
                      <Text style={styles.noComments}>{t('community.no_comments') || 'No comments yet'}</Text>
                    ) : (
                      comments.map((comment) => {
                        const commentTranslated = showCommentTranslation[comment.id]
                          ? translateComment(comment.id, language)
                          : null;

                        return (
                          <View key={comment.id} style={styles.commentItem}>
                            <Image
                              source={{
                                uri:
                                  comment.author?.profileImage ||
                                  'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
                              }}
                              style={styles.commentAvatar}
                            />
                            <View style={styles.commentContent}>
                              <View style={styles.commentHeader}>
                                <Text style={styles.commentAuthor}>
                                  {comment.author?.fullName || 'Unknown'}
                                </Text>
                                <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
                              </View>
                              <Text style={styles.commentText}>{comment.content}</Text>

                              {commentTranslated && showCommentTranslation[comment.id] && (
                                <View style={styles.translationBox}>
                                  <Globe size={10} color="#3b82f6" />
                                  <Text style={[styles.translationText, { fontSize: 12 }]}>
                                    {commentTranslated}
                                  </Text>
                                </View>
                              )}

                              <TouchableOpacity
                                onPress={() => toggleCommentTranslation(comment.id)}
                                style={styles.translateBtnSmall}
                              >
                                <Globe size={11} color="#3b82f6" />
                                <Text style={[styles.translateBtnText, { fontSize: 11 }]}>
                                  {showCommentTranslation[comment.id]
                                    ? t('community.hide_translation') || 'Hide'
                                    : t('community.translate') || 'Translate'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}

                    {/* Comment Input */}
                    <View style={styles.commentInputRow}>
                      <TextInput
                        style={styles.commentInput}
                        placeholder={t('community.add_comment') || 'Add a comment...'}
                        placeholderTextColor="#94a3b8"
                        value={commentTexts[post.id] || ''}
                        onChangeText={(text) =>
                          setCommentTexts((prev) => ({ ...prev, [post.id]: text }))
                        }
                        onSubmitEditing={() => handleSubmitComment(post.id)}
                        returnKeyType="send"
                      />
                      <TouchableOpacity
                        onPress={() => handleSubmitComment(post.id)}
                        disabled={!commentTexts[post.id]?.trim()}
                        style={[
                          styles.commentSendBtn,
                          commentTexts[post.id]?.trim() && styles.commentSendBtnActive,
                        ]}
                      >
                        <Send size={16} color={commentTexts[post.id]?.trim() ? '#ffffff' : '#94a3b8'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Verification Modal */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVerifyModal(false)}
        >
          <View style={styles.verifyModal}>
            <Shield size={48} color="#f59e0b" />
            <Text style={styles.verifyTitle}>
              {t('community.verify_required_title') || 'Verification Required'}
            </Text>
            <Text style={styles.verifyDesc}>
              {t('community.verify_required_desc') ||
                'You need to be verified to post and comment in the community. Please complete your verification first.'}
            </Text>
            <TouchableOpacity style={styles.verifyBtn} onPress={() => setShowVerifyModal(false)}>
              <Text style={styles.verifyBtnText}>{t('common.ok') || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={!!viewerImage}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity style={styles.imageViewerClose} onPress={() => setViewerImage(null)}>
            <X size={28} color="#ffffff" />
          </TouchableOpacity>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Write Prompt
  writePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 14,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  writeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  writePromptText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
  },
  // Write Form
  writeForm: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  writeFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  writeFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  writeInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 100,
    marginBottom: 10,
  },
  tagInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 10,
  },
  imagePreviewRow: {
    marginBottom: 10,
  },
  previewImageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  imagePickerText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  // Posts
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  postCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  postTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  postContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 8,
  },
  translationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  translationText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  translateBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  translateBtnText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  postImagesRow: {
    marginBottom: 10,
  },
  postImage: {
    width: 160,
    height: 120,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#f1f5f9',
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  // Comments
  commentsSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  noComments: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    paddingVertical: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  commentTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  commentText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  commentSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendBtnActive: {
    backgroundColor: '#10b981',
  },
  // Verification modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 30,
    alignItems: 'center',
    gap: 12,
  },
  verifyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  verifyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  verifyBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  verifyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  // Image Viewer
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageViewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
});
