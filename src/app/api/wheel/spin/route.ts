import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper function to select a prize based on weights
const selectWeightedPrize = (segments: any[]) => {
  const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0);
  let random = Math.random() * totalWeight;

  for (const segment of segments) {
    if (random < segment.weight) {
      return segment;
    }
    random -= segment.weight;
  }
  return segments[segments.length - 1]; // Fallback
};

export async function POST(req: NextRequest) {
  const { storeId, sellerId } = await req.json();

  if (!storeId || !sellerId) {
    return NextResponse.json({ error: "storeId e sellerId são obrigatórios" }, { status: 400 });
  }

  try {
    // --- Defensive Check: Validate settings BEFORE the transaction ---
    const settings = await prisma.prize_wheel_settings.findFirst({
      where: { store_id: storeId },
      include: { prize_wheel_segments: { where: { is_active: true } } },
    });

    if (!settings || !settings.prize_wheel_segments || settings.prize_wheel_segments.length === 0) {
      return NextResponse.json(
        { error: "Roleta não configurada ou sem prêmios ativos." },
        { status: 409 } // 409 Conflict is more descriptive than 500
      );
    }
    
    const activeSegments = settings.prize_wheel_segments;

    // --- Atomic Transaction: Perform the spin ---
    const spinResult = await prisma.$transaction(async (tx) => {
      // 1. Check for available credits
      const creditRecord = await tx.prize_wheel_credits.findUnique({
        where: {
          store_id_seller_id: { 
            store_id: storeId,
            seller_id: sellerId,
          },
        },
      });

      if (!creditRecord || creditRecord.credits <= 0) {
        // This specific error is thrown to be caught and returned as a 400
        throw new Error("Créditos insuficientes");
      }

      // 2. Decrement the credit
      const updatedCredits = await tx.prize_wheel_credits.update({
        where: {
          store_id_seller_id: { 
            store_id: storeId,
            seller_id: sellerId,
          },
        },
        data: { credits: { decrement: 1 } },
      });

      // 3. Select the prize and log the spin
      const winningSegment = selectWeightedPrize(activeSegments);
      
      const newSpin = await tx.prize_wheel_spins.create({
        data: {
          store_id: storeId,
          seller_id: sellerId,
          granted_by: 'system', // A spin is always performed by the system/seller
          segment_id: winningSegment.id,
          status: "claimed", // Mark as claimed immediately
          claimed_at: new Date(),
        },
        include: { prize_wheel_segments: true }, // Include the segment details in the result
      });

      return { newSpin, remainingCredits: updatedCredits.credits };
    });

    // --- Success Response ---
    return NextResponse.json({
      message: "Roleta girada com sucesso!",
      remainingCredits: spinResult.remainingCredits,
      prize: {
        id: spinResult.newSpin.prize_wheel_segments.id,
        label: spinResult.newSpin.prize_wheel_segments.label,
        type: spinResult.newSpin.prize_wheel_segments.type,
        value: spinResult.newSpin.prize_wheel_segments.value ? Number(spinResult.newSpin.prize_wheel_segments.value) : null,
        description: spinResult.newSpin.prize_wheel_segments.description,
      },
    });

  } catch (error: any) {
    // --- Error Handling ---
    console.error("[POST /api/wheel/spin]", { message: error.message, stack: error.stack });
    
    if (error.message === "Créditos insuficientes") {
      return NextResponse.json({ error: error.message, noCredits: true }, { status: 400 });
    }

    // Generic fallback for any other unexpected errors
    return NextResponse.json({ error: "Erro ao processar o giro da roleta.", details: error.message }, { status: 500 });
  }
}
