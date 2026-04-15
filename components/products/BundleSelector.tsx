import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ChevronRight } from "lucide-react";
import { Product } from "@/types/product";

interface BundleSelectorProps {
  currentProduct: Product;
  allProducts: Product[];
  onAddToCart: (selections: BundleSelection) => void;
}

export interface BundleSelection {
  packType: "single" | "trio" | "penta";
  fragrances: Product[];
  totalPrice: number;
}

const TRIO_PRICE = 49.99;
const PENTA_PRICE = 99.99;

export default function BundleSelector({
  currentProduct,
  allProducts,
  onAddToCart,
}: BundleSelectorProps) {
  const router = useRouter();
  const [selectedPack, setSelectedPack] = useState<"single" | "trio" | "penta">(
    "single",
  );
  const [fragranceSelections, setFragranceSelections] = useState<
    (Product | null)[]
  >([currentProduct, null, null, null, null]);

  const packCount =
    selectedPack === "single" ? 1 : selectedPack === "trio" ? 3 : 5;

const unitPrice = Number(currentProduct.price.regular) || 26.00;
  const SINGLE_ORIGINAL = unitPrice * 2.5; // Showing a premium original price
  const TRIO_ORIGINAL = unitPrice * 3 * 2; 
  const PENTA_ORIGINAL = unitPrice * 5 * 2;

  // Read localStorage selections on mount
  useEffect(() => {
    const stored = localStorage.getItem("bundleState");
    if (stored) {
      try {
        const state = JSON.parse(stored);
        if (state.packType) {
          // Migration check: if old packType, default to single
          if (state.packType === "duo" || state.packType === "trio_old") {
            setSelectedPack("single");
          } else {
            setSelectedPack(state.packType);
          }
        }

        const selections = state.selections
          ? [...state.selections]
          : [currentProduct, null, null, null, null];

        // Always force current product as first selection
        selections[0] = currentProduct;

        // Pad to 5 if needed
        while (selections.length < 5) selections.push(null);

        setFragranceSelections(selections);

        // Update localStorage to keep it consistent
        localStorage.setItem(
          "bundleState",
          JSON.stringify({
            packType: state.packType || "single",
            selections: selections,
          }),
        );
      } catch {}
    } else {
      setFragranceSelections([currentProduct, null, null, null, null]);
    }
  }, [currentProduct]);

  // When selectedPack changes via user click, we don't automatically clear everything unless they just clicked it right now.
  const handlePackSelect = (packId: "single" | "trio" | "penta") => {
    setSelectedPack(packId);
    const newSelections = [currentProduct, null, null, null, null];
    setFragranceSelections(newSelections);
    localStorage.setItem(
      "bundleState",
      JSON.stringify({ packType: packId, selections: newSelections }),
    );
  };

  const updateFragrance = (index: number, product: Product) => {
    const newSelections = [...fragranceSelections];
    newSelections[index] = product;
    setFragranceSelections(newSelections);
    localStorage.setItem(
      "bundleState",
      JSON.stringify({ packType: selectedPack, selections: newSelections }),
    );
  };

  const openPicker = (slotIndex: number) => {
    localStorage.setItem(
      "bundleState",
      JSON.stringify({
        packType: selectedPack,
        selections: fragranceSelections,
      }),
    );
    const returnTo = window.location.pathname + window.location.search;
    router.push(
      `/?bundleSlot=${slotIndex}&returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  const getPrice = () => {
    if (selectedPack === "single") return unitPrice;
    if (selectedPack === "trio") return TRIO_PRICE;
    return PENTA_PRICE;
  };

  const getOriginalPrice = () => {
    if (selectedPack === "single") return SINGLE_ORIGINAL;
    if (selectedPack === "trio") return TRIO_ORIGINAL;
    return PENTA_ORIGINAL;
  };

  const getSavings = () => (getOriginalPrice() - getPrice()).toFixed(2);

  const handleAddToCart = () => {
    const chosen = fragranceSelections
      .slice(0, packCount)
      .map((f) => f || currentProduct);
    onAddToCart({
      packType: selectedPack,
      fragrances: chosen,
      totalPrice: getPrice(),
    });
  };

  const getImageUrl = (product: Product | null) => {
    if (!product) return "/images/placeholder-product.jpg";
    if (Array.isArray(product.images) && product.images[0])
      return product.images[0];
    return "/images/placeholder-product.jpg";
  };

  const packs = [
    {
      id: "single" as const,
      label: "1 PERFUME",
      price: unitPrice,
      originalPrice: SINGLE_ORIGINAL,
      popular: false,
    },
    {
      id: "trio" as const,
      label: "3 PERFUMES",
      price: TRIO_PRICE,
      originalPrice: TRIO_ORIGINAL,
      popular: true,
    },
    {
      id: "penta" as const,
      label: "5 PERFUMES",
      price: PENTA_PRICE,
      originalPrice: PENTA_ORIGINAL,
      popular: false,
    },
  ];

  return (
    <div className="w-full mt-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold uppercase tracking-widest text-black border-b border-black pb-2">
          BUNDLE &amp; SAVE
        </h3>
      </div>

      {/* Pack Cards — each is its own separate card */}
      <div className="flex flex-col gap-2">
        {packs.map((pack) => {
          const isSelected = selectedPack === pack.id;
          const savings = (pack.originalPrice - pack.price).toFixed(2);
          const showConfig = isSelected && pack.id !== "single";

          return (
            <div key={pack.id} className="relative">
              {/* Most Popular Badge — sits above the card */}
              {pack.popular && (
                <div className="absolute -top-1 -right-12 -translate-x-1/2 z-10">
                  <span className="bg-[#f1f1f1] text-black text-[8px] rounded-full border border-[#7c7c7c] font-black px-3 py-1 uppercase tracking-widest shadow-md whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Card */}
              <div
                className={`rounded-lg overflow-hidden border transition-all duration-200 ${
                  isSelected ? "border-[#7c7c7c] shadow-lg" : "border-[#dbdbdb]"
                } ${pack.popular ? "mt-3" : ""}`}
              >
                {/* Pack Row Button */}
                <button
                  onClick={() => handlePackSelect(pack.id)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left"
                  style={{ backgroundColor: "#f1f1f1" }}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio */}
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "border-[#7c7c7c] bg-white"
                          : "border-[#d4d4d4]"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-4 h-4 flex items-center justify-center rounded-full bg-black" />
                      )}
                    </div>

                    <div>
                      <div className="text-black font-black text-sm tracking-wider">
                        {pack.label}
                      </div>
                      {pack.id !== "single" && (
                        <div className="mt-1">
                          <span className="bg-[#E00030] text-white text-[10px] font-bold px-2 py-0.5 tracking-wider rounded-sm">
                            SAVE £{savings}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-black font-black text-xl">
                      £{pack.price.toFixed(2)}
                    </div>
                    <div className="text-black/60 text-xs line-through">
                      £{pack.originalPrice.toFixed(2)}
                    </div>
                  </div>
                </button>

                {/* Fragrance Configurator (Duo & Trio when selected) */}
                {showConfig && (
                  <div className="bg-white border-t border-[#d4d4d4] px-4 pb-4 pt-3">
                    <div className="text-black text-[11px] font-bold uppercase tracking-widest mb-3">
                      CONFIGURE YOUR ITEMS: SELECT FRAGRANCE
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: packCount }).map((_, idx) => {
                        const chosen = fragranceSelections[idx];

                        return (
                          <div key={idx} className="relative">
                            <div className="flex items-center gap-2">
                              {/* Thumbnail */}
                              <div className="w-12 h-12 bg-[#f1f1f1] border border-[#d4d4d4] rounded flex-shrink-0 overflow-hidden">
                                {chosen && (
                                  <Image
                                    src={getImageUrl(chosen)}
                                    alt={chosen.title}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-contain"
                                  />
                                )}
                              </div>

                              {/* Navigate-to-picker Button */}
                              <button
                                onClick={() => openPicker(idx)}
                                className="flex-1 flex items-center justify-between bg-[#d4d4d4] border border-[#333] hover:border-white transition-colors px-3 py-1.5 rounded-xl text-left"
                              >
                                <div>
                                  <div className="text-black/70 text-[9px] font-bold uppercase tracking-widest">
                                    SELECT FRAGRANCE
                                  </div>
                                  <div className="text-black text-[12px] font-bold truncate max-w-[200px]">
                                    {chosen
                                      ? chosen.title.toUpperCase()
                                      : "CHOOSE YOUR FRAGRANCE..."}
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#888] flex-shrink-0 ml-2" />
                              </button>

                              {/* Size Badge */}
                              <div className="bg-[#d4d4d4] font-bold text-black text-[11px] px-2 py-2.5 rounded flex-shrink-0">
                                100ML
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add to Cart */}
      <div className="mt-4">
        <button
          onClick={handleAddToCart}
          className="w-full bg-black hover:bg-black/90 text-white font-black py-3.5 uppercase tracking-widest text-sm transition-colors duration-200 rounded"
        >
          ADD TO BAG
        </button>
      </div>
    </div>
  );
}
