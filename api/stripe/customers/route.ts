import { type NextRequest, NextResponse } from "next/server"
import { stripeService } from "@/lib/services/stripe-integration-service"

export async function POST(request: NextRequest) {
  try {
    const { email, name, metadata } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log(`👤 Creating Stripe customer for: ${email}`)

    const result = await stripeService.createCustomer(email, name, metadata)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      customer: result.customer,
      message: "Customer created successfully",
    })
  } catch (error) {
    console.error("❌ Error creating customer:", error)
    return NextResponse.json(
      {
        error: "Failed to create customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    console.log(`👤 Retrieving Stripe customer: ${customerId}`)

    const result = await stripeService.getCustomer(customerId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      customer: result.customer,
    })
  } catch (error) {
    console.error("❌ Error retrieving customer:", error)
    return NextResponse.json(
      {
        error: "Failed to retrieve customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { customerId, ...updates } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    console.log(`👤 Updating Stripe customer: ${customerId}`)

    const result = await stripeService.updateCustomer(customerId, updates)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      customer: result.customer,
      message: "Customer updated successfully",
    })
  } catch (error) {
    console.error("❌ Error updating customer:", error)
    return NextResponse.json(
      {
        error: "Failed to update customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
