import { compare } from "bcrypt";
import { prisma } from "./prisma";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "default-secret-key"
);

export async function signIn(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { error: "Invalid credentials" };
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return { error: "Invalid credentials" };
    }

    // Create the session token
    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secretKey);

    // Set the session cookie
    cookies().set("session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return { error: "An error occurred during sign in" };
  }
}

export async function signOut() {
  cookies().delete("session-token");
}

export async function getSession() {
  try {
    const token = cookies().get("session-token")?.value;

    if (!token) {
      return null;
    }

    const verified = await jwtVerify(token, secretKey);
    return verified.payload as {
      id: string;
      username: string;
      isAdmin: boolean;
    };
  } catch (error) {
    return null;
  }
}
