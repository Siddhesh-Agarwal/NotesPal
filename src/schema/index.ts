import z from "zod";

export const userIdSchema = z.object({
  userId: z.string().min(1),
});

export const userAndNoteSchema = z.object({
  ...userIdSchema.shape,
  noteId: z.string().min(1),
});

export const noteSchema = z.object({
  content: z.string(),
  tapeColor: z.string().min(7).max(7),
});

export const signupFormSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(1, { message: "Password must be at least 1 character long" }),
  confirmPassword: z.string().min(1),
  termsAccepted: z.boolean().refine((value) => value, {
    message: "You must accept the terms and conditions",
  }),
});

export const otpFormSchema = z.object({
  otp: z
    .string()
    .min(6, { message: "OTP must be 6 digits" })
    .max(6, { message: "OTP must be 6 digits" }),
});

export const profileFormSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.email(),
});

export const passwordFormSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
  confirmNewPassword: z.string().min(1),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
