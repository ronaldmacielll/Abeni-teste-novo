/**
 * InstagramPostCard Component
 * 
 * Displays a single Instagram post with metrics and account information
 * Implements Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, Badge } from '@/lib/design-system/components';
import { Eye, MousePointer, Heart, Users, MessageCircle, Instagram } from 'lucide-react';
import { clsx } from 'clsx';
import type { Post } from '../types/post.types';

export interface InstagramPostCardProps {
  post: Post;
  onImageError?: () => void;
}

/**
 * Format number with locale formatting
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * InstagramPostCard Component
 * 
 * Renders an Instagram post card with:
 * - Thumbnail image with fallback
 * - Instagram badge to identify source
 * - Account name
 * - All metrics: Alcance, Engajamento, Impressões, Cliques, Likes, Comments
 * - Responsive layout
 */
export const InstagramPostCard: React.FC<InstagramPostCardProps> = ({ post, onImageError }) => {
  const [imageError, setImageError] = useState(false);

  // Ensure this is an Instagram post
  if (post.source !== 'instagram') {
    return null;
  }

  const handleImageError = () => {
    setImageError(true);
    onImageError?.();
  };

  // Extract Instagram-specific metrics
  const instagramMetrics = post.metrics as any;
  const likes = instagramMetrics?.likes ?? 0;
  const comments = instagramMetrics?.comments ?? 0;

  return (
    <Card variant="default" hover className="flex flex-col h-full">
      {/* Thumbnail Section - 16:9 aspect ratio */}
      <div className="relative w-full aspect-video bg-gray-100 rounded-md overflow-hidden mb-4">
        {post.imageUrl && !imageError ? (
          <Image
            src={post.imageUrl}
            alt={post.title || 'Instagram post'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={handleImageError}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Instagram className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Sem imagem</p>
            </div>
          </div>
        )}
      </div>

      {/* Header with Instagram Badge and Account Name */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex-1">
          <Badge variant="info" className="inline-flex items-center gap-1">
            <Instagram className="w-3 h-3" />
            Instagram
          </Badge>
        </div>
      </div>

      {/* Account Name */}
      {post.instagramAccountName && (
        <p className="text-xs text-gray-400 mb-2">
          Conta: <span className="text-gray-300 font-medium">{post.instagramAccountName}</span>
        </p>
      )}

      {/* Title/Caption */}
      {post.title && (
        <h3 className="text-base font-semibold text-white mb-4 line-clamp-2">
          {post.title}
        </h3>
      )}

      {/* Metrics Grid - 2 columns on mobile, 3 columns on larger screens */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {/* Alcance */}
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Alcance</p>
            <p className="text-sm font-semibold text-white truncate">
              {formatNumber(post.metrics.alcance)}
            </p>
          </div>
        </div>

        {/* Engajamento */}
        <div className="flex items-start gap-2">
          <Heart className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Engajamento</p>
            <p className="text-sm font-semibold text-white truncate">
              {formatNumber(post.metrics.engajamento)}
            </p>
          </div>
        </div>

        {/* Impressões */}
        <div className="flex items-start gap-2">
          <Eye className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Impressões</p>
            <p className="text-sm font-semibold text-white truncate">
              {formatNumber(post.metrics.impressoes)}
            </p>
          </div>
        </div>

        {/* Cliques */}
        <div className="flex items-start gap-2">
          <MousePointer className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Cliques</p>
            <p className="text-sm font-semibold text-white truncate">
              {formatNumber(post.metrics.cliques)}
            </p>
          </div>
        </div>

        {/* Likes */}
        <div className="flex items-start gap-2">
          <Heart className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Likes</p>
            <p className="text-sm font-semibold text-white truncate">
              {formatNumber(likes)}
            </p>
          </div>
        </div>

        {/* Comments */}
        <div className="flex items-start gap-2">
          <MessageCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Comentários</p>
            <p className="text-sm font-semibold text-white truncate">
              {formatNumber(comments)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
