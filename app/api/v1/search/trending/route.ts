import { NextResponse } from "next/server";

export async function GET() {
  try {
    const trendingTerms = [
      { term: "organic milk", category: "Dairy & Eggs", score: 98 },
      { term: "fresh chicken", category: "Meat & Poultry", score: 95 },
      { term: "basmati rice", category: "Pasta & Rice", score: 92 },
      { term: "green tea", category: "Beverages", score: 89 },
      { term: "olive oil", category: "Cooking Essentials", score: 87 },
      { term: "almonds", category: "Snacks", score: 85 },
      { term: "egg", category: "Dairy & Eggs", score: 83 },
      { term: "bread", category: "Bakery", score: 80 },
      { term: "tomato", category: "Fruits & Vegetables", score: 78 },
      { term: "juice", category: "Beverages", score: 75 },
    ];

    return NextResponse.json({
      success: true,
      data: trendingTerms,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
