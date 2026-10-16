"use client";

import React from "react";
import Image from "next/image";
import { Plus, Minus, Sparkles, Egg, Leaf } from "lucide-react";
import { MenuItem } from "@/types/cafe";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  item: MenuItem;
  onOpenDetails: (item: MenuItem) => void;
}

export default function ProductCard({ item, onOpenDetails }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const [imgError, setImgError] = React.useState(false);

  const matchingCartItems = items.filter((i) => i.menuItemId === item.id);
  const totalQuantityInCart = matchingCartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    addItem(item, 1);
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (matchingCartItems.length > 0) {
      updateQuantity(matchingCartItems[0].id, -1);
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (matchingCartItems.length > 0) {
      updateQuantity(matchingCartItems[0].id, 1);
    } else {
      addItem(item, 1);
    }
  };

  const handleCardClick = () => {
    if (!item.isAvailable) return;
    if (totalQuantityInCart === 0) {
      addItem(item, 1);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-[#FFFFFF] rounded-2xl overflow-hidden border border-[#B8A99A]/30 hover:border-[#C6A46C] shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer ${
        !item.isAvailable ? "opacity-60 grayscale-[35%]" : ""
      }`}
    >
      {/* Top Image Section */}
      <div className="relative w-full aspect-[4/3] bg-[#F7F2EA] overflow-hidden">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#F7F2EA] text-[#493126] p-4 text-center">
            <Sparkles className="w-6 h-6 text-[#C6A46C] mb-1" />
            <span className="font-serif font-bold text-xs text-[#241713] line-clamp-1">{item.name}</span>
          </div>
        ) : (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            unoptimized
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        )}

        {/* Dietary Tag Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[#FFFFFF]/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-xs border border-[#B8A99A]/20">
          {item.dietary === "veg" && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-800">VEG</span>
            </div>
          )}
          {item.dietary === "vegan" && (
            <div className="flex items-center gap-1">
              <Leaf className="w-2.5 h-2.5 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-800">VEGAN</span>
            </div>
          )}
          {item.dietary === "non-veg" && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span className="text-[10px] font-bold text-rose-800">NON-VEG</span>
            </div>
          )}
          {item.dietary === "egg" && (
            <div className="flex items-center gap-1">
              <Egg className="w-2.5 h-2.5 text-amber-600" />
              <span className="text-[10px] font-bold text-amber-800">EGG</span>
            </div>
          )}
        </div>

        {/* Special Offer / Chef Special in Champagne Gold */}
        {item.isFeatured && item.isAvailable && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#C6A46C] text-[#241713] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <Sparkles className="w-3 h-3 text-[#241713]" />
            <span>Special</span>
          </div>
        )}

        {/* Sold out overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-[#241713]/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 bg-[#493126] text-[#F7F2EA] font-bold text-xs uppercase tracking-wider rounded-lg border border-[#C6A46C]/40">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3.5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-serif font-bold text-sm md:text-base text-[#241713] line-clamp-1 group-hover:text-[#493126] transition-colors">
            {item.name}
          </h3>
          <p className="text-xs text-[#B8A99A] line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-[#F7F2EA]">
          {/* Price Highlight: Rich Coffee */}
          <div>
            <span className="text-[10px] text-[#B8A99A] font-medium block leading-none">Price</span>
            <span className="font-serif font-bold text-base md:text-lg text-[#493126]">
              ₹{item.price}
            </span>
          </div>

          {/* Primary Action Button: Deep Espresso with White text */}
          {item.isAvailable ? (
            totalQuantityInCart > 0 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center bg-[#241713] text-[#F7F2EA] rounded-xl overflow-hidden shadow-xs text-xs font-semibold"
              >
                <button
                  onClick={handleMinusClick}
                  className="px-2.5 py-1.5 hover:bg-[#493126] transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3 text-[#C6A46C]" />
                </button>
                <span className="px-2 font-bold text-xs text-[#F7F2EA]">{totalQuantityInCart}</span>
                <button
                  onClick={handlePlusClick}
                  className="px-2.5 py-1.5 hover:bg-[#493126] transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3 text-[#C6A46C]" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <span>ADD</span>
                <Plus className="w-3 h-3 text-[#C6A46C]" />
              </button>
            )
          ) : (
            <span className="text-xs font-semibold text-[#B8A99A]">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}
