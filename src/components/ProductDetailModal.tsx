"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Plus, Minus, Check, MessageSquare, Sparkles } from "lucide-react";
import { MenuItem } from "@/types/cafe";
import { useCart } from "@/context/CartContext";

interface ProductDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export default function ProductDetailModal({ item, onClose }: ProductDetailModalProps) {
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [specialNotes, setSpecialNotes] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSpecialNotes("");
      setImgError(false);

      if (item.sizes && item.sizes.length > 0) {
        setSelectedSize(item.sizes[0].name);
      } else {
        setSelectedSize("");
      }

      if (item.options && item.options.length > 0) {
        const initialOptions: Record<string, string> = {};
        item.options.forEach((group) => {
          if (group.choices.length > 0) {
            initialOptions[group.name] = group.choices[0].label;
          }
        });
        setSelectedOptions(initialOptions);
      } else {
        setSelectedOptions({});
      }
    }
  }, [item]);

  if (!item) return null;

  let calculatedUnitPrice = item.price;
  if (selectedSize && item.sizes) {
    const s = item.sizes.find((x) => x.name === selectedSize);
    if (s) calculatedUnitPrice += s.priceDelta;
  }
  if (item.options) {
    item.options.forEach((group) => {
      const choiceLabel = selectedOptions[group.name];
      if (choiceLabel) {
        const choice = group.choices.find((c) => c.label === choiceLabel);
        if (choice) calculatedUnitPrice += choice.priceDelta;
      }
    });
  }

  const grandTotal = calculatedUnitPrice * quantity;

  const handleAddToCart = () => {
    addItem(item, quantity, selectedSize, selectedOptions, specialNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up border border-[#B8A99A]/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-full flex justify-center pt-2.5 pb-1 bg-[#241713]">
          <div className="w-12 h-1 bg-[#B8A99A]/50 rounded-full" />
        </div>

        {/* Header Image & Close */}
        <div className="relative w-full h-56 bg-[#F7F2EA] flex items-center justify-center">
          {imgError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F7F2EA] text-[#493126] p-6 text-center">
              <Sparkles className="w-8 h-8 text-[#C6A46C] mb-2" />
              <span className="font-serif font-bold text-lg text-[#241713]">{item.name}</span>
            </div>
          ) : (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              unoptimized
              onError={() => setImgError(true)}
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#241713]/80 via-transparent to-black/30 pointer-events-none" />

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#241713]/60 hover:bg-[#241713] text-[#F7F2EA] flex items-center justify-center backdrop-blur-sm transition-colors border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 text-[#F7F2EA]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-white/20 backdrop-blur-sm border border-white/20">
                {item.category}
              </span>
              {item.isFeatured && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-[#C6A46C] text-[#241713]">
                  <Sparkles className="w-3 h-3 text-[#241713]" /> Chef Special
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#F7F2EA] drop-shadow-sm">
              {item.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-grow bg-[#FFFFFF]">
          {/* Description */}
          <p className="text-sm text-[#B8A99A] leading-relaxed">
            {item.description}
          </p>

          {/* Size Options */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold tracking-wider uppercase text-[#241713]">
                Choose Size
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {item.sizes.map((size) => {
                  const isSelected = selectedSize === size.name;
                  return (
                    <button
                      key={size.name}
                      type="button"
                      onClick={() => setSelectedSize(size.name)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-[#241713] bg-[#F7F2EA] text-[#241713] ring-1 ring-[#241713] font-bold"
                          : "border-[#B8A99A]/30 bg-white text-[#493126] hover:border-[#241713]"
                      }`}
                    >
                      <span className="font-semibold text-sm">{size.name}</span>
                      <span className="text-[#C6A46C] font-bold mt-0.5">
                        {size.priceDelta > 0 ? `+₹${size.priceDelta}` : "Standard"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Custom Options */}
          {item.options &&
            item.options.map((group) => (
              <div key={group.name} className="space-y-2.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-[#241713]">
                  {group.name}
                </label>
                <div className="space-y-1.5">
                  {group.choices.map((choice) => {
                    const isSelected = selectedOptions[group.name] === choice.label;
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        onClick={() =>
                          setSelectedOptions((prev) => ({
                            ...prev,
                            [group.name]: choice.label,
                          }))
                        }
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? "border-[#241713] bg-[#F7F2EA] text-[#241713] font-bold"
                            : "border-[#B8A99A]/30 bg-white text-[#493126] hover:border-[#241713]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-[#C6A46C] bg-[#C6A46C] text-[#241713]"
                                : "border-[#B8A99A]/60"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span>{choice.label}</span>
                        </div>
                        <span className="text-[#493126] font-bold">
                          {choice.priceDelta > 0 ? `+₹${choice.priceDelta}` : "Free"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Kitchen Notes */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-[#241713]">
              <MessageSquare className="w-3.5 h-3.5 text-[#C6A46C]" />
              Special Instructions
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. Extra hot, less sweet, no ice, dressing on the side"
              className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-[#F7F2EA] border border-[#B8A99A]/30 rounded-xl text-[#241713] placeholder:text-[#B8A99A] focus:outline-none focus:ring-1 focus:ring-[#C6A46C]"
            />
          </div>
        </div>

        {/* Footer with Quantity Counter & Add to Order Button */}
        <div className="p-4 bg-[#F7F2EA] border-t border-[#B8A99A]/20 flex items-center gap-3">
          {/* Quantity selector */}
          <div className="flex items-center bg-[#FFFFFF] border border-[#B8A99A]/40 rounded-xl overflow-hidden shadow-xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2.5 text-[#241713] hover:bg-black/5 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4 text-[#493126]" />
            </button>
            <span className="px-3 font-bold text-sm text-[#241713]">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2.5 text-[#241713] hover:bg-black/5 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4 text-[#493126]" />
            </button>
          </div>

          {/* Primary Action Button: Deep Espresso with white text */}
          <button
            onClick={handleAddToCart}
            className="flex-grow flex items-center justify-between px-5 py-3.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-xl font-bold text-sm shadow-md transition-all active:scale-98"
          >
            <span>Add to Order</span>
            <span className="text-[#C6A46C] font-serif text-base">₹{grandTotal}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
