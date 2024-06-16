import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { stat } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { usernameSchema } from "src/Schema/SignupSchema";
import { dbconnect } from "src/lib/prisma";
import { sendVerificationEmail } from "src/utils/sendVerificationEmail";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const prisma = await dbconnect();
  try {
    const { username, email, password, name } = await req.json();

    const existingUserVerifiedByUsername = await prisma.user.findFirst({
      where: {
        username,
        isVerified: true,
      },
    });

    if (existingUserVerifiedByUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "username is already taken",
        },
        { status: 400 }
      );
    }

    const existingUserByEmail = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return NextResponse.json(
          {
            success: false,
            message: "email is already taken",
          },
          { status: 400 }
        );
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);

        await prisma.user.update({
          where: {
            id: existingUserByEmail.id,
          },
          data: existingUserByEmail,
        });
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const expirtDate = new Date();
      expirtDate.setHours(expirtDate.getHours() + 1);

      const newUser = await prisma.user.create({
        data: {
          name,
          username,
          email,
          password: hashedPassword,
          verifyCode,
          verifyCodeExpiry: expirtDate,
          isVerified: false,
        },
      });

      console.log("newUser", newUser);
    }

    //send verification email
    console.log("verifyCode", verifyCode);
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );

    console.log("emailResponse", emailResponse);

    if (!emailResponse.success) {
      return NextResponse.json(
        { success: false, message: emailResponse.message },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "user regestered successfully, please verify your email",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error in creating user", error);
    return NextResponse.json(
      { success: false, message: "Error in creating user" },
      {
        status: 500,
      }
    );
  }
}
