/**
 * PostCard Component
 * 
 * Displays a single post with thumbnail, status badge, and metrics
 * Implements Requirements: 4.1, 4.2, 4.3, 4.4, 13.5, 14.1, 14.2
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, Badge } from '@/lib/design-system/components';
import { Eye, MousePointer, Heart, Users } from 'lucide-react';
import type { Post, PostStatus } from '../types/post.types';

export interface PostCardProps {
  post: Post;
  onImageError?: () => void;
}

/**
 * Map post status to badge variant
 */
function getStatusVariant(status: PostStatus): 'success' | 'info' | 'neutral' | 'warning' {
  switch (status) {
    case 'Publicado':
      return 'success';
    case 'Agendado':
      return 'info';
    case 'Rascunho':
      return 'neutral';
    case 'Arquivado':
      return 'warning';
    default:
      return 'neutral';
  }
}

/**
 * Format number with locale formatting
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * PostCard Component
 * 
 * Renders a post card with:
 * - Thumbnail image with fallback
 * - Status badge
 * - Metrics grid (Alcance, Engajamento, Impressões, Cliques)
 * - Responsive layout
 */
export const PostCard: React.FC<PostCardProps> = ({ post, onImageError }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    onImageError?.();
  };

  return (
    <Card variant="default" hover className="flex flex-col h-full">
      {/* Thumbnail Section - 16:9 aspect ratio */}
      <div className="relative w-full aspect-video bg-gray-100 rounded-md overflow-hidden mb-4">
        {post.imageUrl && !imageError ? (
          <Image
            src={post.imageUrl}
            alt={post.title || 'Post image'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={handleImageError}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Eye className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Sem imagem</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <Badge variant={getStatusVariant(post.status)}>
          {post.status}
        </Badge>
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="text-base font-semibold text-gray-900 mb-4 line-clamp-2">
          {post.title}
        </h3>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {/* Alcance */}
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-600">Alcance</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {formatNumber(post.metrics.alcance)}
            </p>
          </div>
        </div>

        {/* Engajamento */}
        <div className="flex items-start gap-2">
          <Heart className="w-4 h-4 text-danger-main mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-600">Engajamento</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {formatNumber(post.metrics.engajamento)}
            </p>
          </div>
        </div>

        {/* Impressões */}
        <div className="flex items-start gap-2">
          <Eye className="w-4 h-4 text-info-main mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-600">Impressões</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {formatNumber(post.metrics.impressoes)}
            </p>
          </div>
        </div>

        {/* Cliques */}
        <div className="flex items-start gap-2">
          <MousePointer className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-600">Cliques</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {formatNumber(post.metrics.cliques)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
