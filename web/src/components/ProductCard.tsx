// d:\Kindr\web\src\components\ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Sparkles } from 'lucide-react';
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
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
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
          {isOwn && (
            <span className="kw-badge kw-badge-coral">Tin của mẹ</span>
          )}
          {!isOwn && isCharity && (
            <span className="kw-badge kw-badge-coral">
              <Sparkles size={12} /> Tặng 0 Xu
            </span>
          )}
        </div>

        {/* Distance & Category Bottom Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            backgroundColor: 'rgba(26, 29, 32, 0.72)',
            color: 'var(--color-on-primary)',
            padding: '3px 10px',
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
              lineHeight: 1.35,
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
          {/* Price Row */}
          <div
            className="kw-product-card-price-row"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 4,
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <KindrCoin size={16} />
              <span
                className="kw-product-card-price"
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: isCharity ? 'var(--color-secondary-dark)' : 'var(--color-primary)',
                }}
              >
                {isCharity ? '0 Xu (Tặng)' : `${product.price} Xu`}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {isCharity ? 'Miễn phí' : `~ ${formatXuToVND(product.price)}`}
            </span>
          </div>

          {/* Seller Footer */}
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
                color: 'var(--color-secondary-dark)',
                flexShrink: 0,
              }}
              title="Đã ký quỹ bảo chứng chất lượng"
            >
              <ShieldCheck size={13} />
              <span>Escrow</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
