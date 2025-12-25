import prisma from '../../config/database';
import { CreateUserDTO, UpdateUserProfileDTO, UserResponse } from './users-types';

export class UserService {
  async syncUserFromClerk(clerkId: string, email: string): Promise<UserResponse> {
    try {
      let user = await prisma.user.findUnique({
        where: { clerkId },
        include: { profile: true },
      });

      if (!user) {
        // Check if a user with this email already exists
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email },
          include: { profile: true },
        });

        if (existingUserByEmail) {
          // Update the existing user with the new clerkId
          user = await prisma.user.update({
            where: { email },
            data: { clerkId },
            include: { profile: true },
          });
        } else {
          // Create a new user
          user = await prisma.user.create({
            data: {
              clerkId,
              email,
              profile: {
                create: {},
              },
            },
            include: { profile: true },
          });
        }
      }

      return user as UserResponse;
    } catch (error) {
      console.error('Error syncing user from Clerk:', error);
      throw new Error('Failed to sync user');
    }
  }

  async getUserByClerkId(clerkId: string): Promise<UserResponse | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        include: { profile: true },
      });

      return user as UserResponse | null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  async updateUserProfile(
    clerkId: string,
    data: UpdateUserProfileDTO
  ): Promise<UserResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        include: { profile: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = await prisma.user.update({
        where: { clerkId },
        data: {
          profile: {
            upsert: {
              create: data,
              update: data,
            },
          },
        },
        include: { profile: true },
      });

      return updatedUser as UserResponse;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  async deleteUser(clerkId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { clerkId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
}

export const userService = new UserService();