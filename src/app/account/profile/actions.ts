"use server";

import { revalidatePath } from "next/cache";

import { updateCustomer } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";

export type ProfileState = {
  ok: boolean;
  message?: string;
  firstName?: string;
  lastName?: string;
};

export async function updateProfileAction(
  _prev: ProfileState | null,
  formData: FormData,
): Promise<ProfileState> {
  await requireCustomer("/account/profile");

  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";

  if (!firstName && !lastName) {
    return { ok: false, message: "Enter at least one name to save." };
  }

  try {
    const result = await updateCustomer({ firstName, lastName });

    // The pages are force-dynamic, but the client router cache still holds the
    // RSC payload rendered before the mutation — without this the profile and
    // the overview keep showing the pre-save name until a hard reload.
    revalidatePath("/account/profile");
    revalidatePath("/account");

    return {
      ok: true,
      message: "Your profile was updated.",
      firstName: result.firstName ?? undefined,
      lastName: result.lastName ?? undefined,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not save your details.",
    };
  }
}
