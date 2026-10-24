// d:\Kindr\web\src\components\ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { KindrCoin, Avatar } from './KindrCoin';
import { formatXuToVND, getCategoryLabel, getConditionLabel } from '../utils/pricing';

interface ProductCardProps {
  product: Product;
  currentUserId?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, currentUserId }) => {
  const isOwn = Boolean(currentUserId && product.sellerId === currentUserId);
  const isCharity =
    product.price === 0 || product.category === 'charity' || product.category === 'tu_thien';

  return (
    <Link
      to={`/products/${product.id}`}
      className="kw-product-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-card)',
        borderRadius: 'var(--radius-md)',
        border: '1.5px solid var(--color-border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.borderColor = 'var(--color-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      {/* Thumbnail 4:3 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          backgroundColor: 'var(--color-surface-subtle)',
          overflow: 'hidden',
        }}
      >
        <img
          src={
            product.image ||
            'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600'
          }
          alt={product.name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/images/kindr-mascot-full.png';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Top Badges */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span className="kw-badge kw-badge-teal">
            {product.conditionLabel || getConditionLabel(product.condition)}
          </span>
          {isOwn && <span className="kw-badge kw-badge-coral">Bài của mẹ</span>}
          {!isOwn && isCharity && (
            <span className="kw-badge kw-badge-coral">
              <Sparkles size={12} /> Tặng miễn phí
            </span>
          )}
        </div>

        {/* Distance & Category Bottom Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            backgroundColor: 'rgba(35, 31, 32, 0.76)',
            color: 'var(--color-on-primary)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <MapPin size={12} color="var(--color-accent)" />
          <span>{product.distance || product.locationName?.split(',')[0] || 'Đà Nẵng'}</span>
        </div>
      </div>

      {/* Card Body */}
      <div
        className="kw-product-card-body"
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div>
          <div
            className="kw-product-card-cat"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-secondary-dark)',
              marginBottom: 4,
            }}
          >
            {getCategoryLabel(product.category)}
            {product.ageRange ? ` • Bé ${product.ageRange}` : ''}
          </div>
          <h3
            className="kw-product-card-title"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--color-text)',
              lineHeight: 1.38,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.name}
          </h3>
        </div>

        <div>
          {/* Clear Price Pill (Xu + VNĐ side by side for first-time users) */}
          <div
            className="kw-product-card-price-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isCharity
                ? 'var(--color-secondary-light)'
                : 'var(--color-pastel-butter)',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <KindrCoin size={16} />
              <span
                className="kw-product-card-price"
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: isCharity ? 'var(--color-secondary-dark)' : 'var(--color-primary-dark)',
                }}
              >
                {isCharity ? 'Tặng 0đ' : `${product.price} Xu`}
              </span>
            </div>
            <span
              style={{
                fontSize: 12,
                color: isCharity ? 'var(--color-secondary-dark)' : 'var(--color-coin-text)',
                fontWeight: 700,
              }}
            >
              {isCharity ? '0 Xu' : `(${formatXuToVND(product.price)})`}
            </span>
          </div>

          {/* Seller Footer + Clear Action Hint */}
          <div
            className="kw-product-card-footer"
            style={{
              paddingTop: 8,
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
              <Avatar uri={product.sellerAvatar} name={product.sellerName} size={24} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {product.sellerName}
              </span>
            </div>
            <span
              className="kw-product-card-escrow"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-primary-dark)',
                flexShrink: 0,
              }}
              title="Bấm vào để xem ảnh chi tiết và đổi đồ"
            >
              <ShieldCheck size={13} color="var(--color-secondary-dark)" />
              <span>{isOwn ? 'Xem bài' : 'Đổi đồ'}</span>
              <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
