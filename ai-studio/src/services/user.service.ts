import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      credits: true,
      industry: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
}

export async function updateUser(
  id: string,
  data: { name?: string; avatar?: string; industry?: string }
) {
  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      credits: true,
      industry: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
}

export async function register(data: {
  email: string;
  password: string;
  name: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("该邮箱已注册");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      credits: 20,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      credits: true,
      createdAt: true,
    },
  });

  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user || !user.password) {
    throw new Error("用户不存在");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new Error("当前密码不正确");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      credits: true,
      industry: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
}
