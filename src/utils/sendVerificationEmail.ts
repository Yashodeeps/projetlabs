import { resend } from "../lib/resend";
import VerificationEmail from "../../emails/VerificationEmail";
import { ApiResponse } from "src/types/ApiResponse";

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "ProJet Verification Email",
      react: VerificationEmail({ username, otp: verifyCode }),
    });

    return { success: true, message: "verification email send successfully" };
  } catch (emailError) {
    console.error(
      "error sending verification email, try again after some time",
      emailError
    );
    return {
      success: false,
      message: "error sending verification email, try again after some time",
    };
  }
}
