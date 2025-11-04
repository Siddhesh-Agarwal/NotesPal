import { useSignUp } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { LogInIcon, MoveLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { metadata } from "@/data/meta";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { polar } from "@/integrations/polar";
import { generateSalt } from "@/lib/encrypt";
import { useStore } from "@/store";

export const Route = createFileRoute("/auth/sign-up")({
  component: RouteComponent,
});

const signupFormSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.email({ message: "Invalid email address" }),
  password: z.string(),
  confirmPassword: z.string().min(8),
  termsAccepted: z.boolean().refine((value) => value, {
    message: "You must accept the terms and conditions",
  }),
});
const otpFormSchema = z.object({
  otp: z
    .string()
    .min(6, { message: "OTP must be 6 digits" })
    .max(6, { message: "OTP must be 6 digits" }),
});

type SignupFormSchema = z.infer<typeof signupFormSchema>;
type OtpFormSchema = z.infer<typeof otpFormSchema>;

const createUserInfo = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().min(1),
      data: signupFormSchema,
    }),
  )
  .handler(async (request) => {
    const { data, userId } = request.data;
    const { id: customerId } = await polar.customers.create({
      externalId: userId,
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
    });
    const [user] = await db
      .insert(userTable)
      .values({
        id: userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        customerId: customerId,
        salt: generateSalt(),
      })
      .returning();
    return user;
  });

function RouteComponent() {
  const signupForm = useForm<SignupFormSchema>({
    resolver: zodResolver(signupFormSchema),
  });
  const otpForm = useForm<OtpFormSchema>({
    resolver: zodResolver(otpFormSchema),
  });
  const { isLoaded, signUp, setActive } = useSignUp();
  const [verifying, setVerifying] = useState(false);
  const { userId, setUser } = useStore((s) => s);
  const navigate = useNavigate();

  if (userId !== null) {
    navigate({ to: "/notes", ignoreBlocker: true });
  }

  async function onSubmit(data: SignupFormSchema) {
    if (data.password !== data.confirmPassword) {
      signupForm.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    if (!isLoaded) return;

    try {
      const result = await signUp.create({
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.email,
        password: data.password,
        legalAccepted: data.termsAccepted,
      });

      if (result.status === "complete") {
        if (!result.id) {
          toast.error("User ID not found");
          return;
        }
        await completeSignUp(result.id);
      } else {
        await result.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setVerifying(true);
      }
    } catch (err) {
      const name =
        err instanceof Error ? err.name : "An unknown error occurred";
      const message =
        err instanceof Error ? err.message : "Please try again later";
      toast.error(name, { description: message });
    }
  }

  async function verifyCode(values: OtpFormSchema) {
    if (!isLoaded || !signUp) return;

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: values.otp,
      });

      if (result.status === "complete") {
        if (!result.createdUserId) {
          toast.error("User ID not found");
          return;
        }
        await completeSignUp(result.createdUserId);
      } else {
        toast.error("Verification failed", {
          description: "Invalid code. Please try again.",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      toast.error("Error", { description: message });
    }
  }

  async function completeSignUp(userId: string) {
    if (!signUp) return;

    await setActive({ session: signUp.createdSessionId });
    const user = await createUserInfo({
      data: { userId, data: signupForm.getValues() },
    });
    setUser({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      customerId: user.customerId,
    });

    const params = new URLSearchParams();
    params.append("products", "80b1520f-73f6-4f47-8110-cd16041497d9");
    params.append("customerId", user.customerId);
    params.append("customerExternalId", user.id);
    params.append("customerName", `${user.firstName} ${user.lastName}`);
    params.append("customerEmail", user.email);

    const response = await fetch(`/api/portal?${params.toString()}`);
    console.log(response);

    const { url } = await response.json();
    window.location.href = url || `${metadata.site}/notes`;
  }

  async function resentOTP() {
    try {
      await signUp?.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      toast.success("Code resent");
    } catch {
      toast.error("Failed to resend code");
    }
  }

  if (verifying) {
    return (
      <div className="bg-background h-screen grid place-items-center">
        <div className="max-w-xl w-full p-4">
          <Link to="/" className="flex gap-2 mb-2 hover:underline">
            <MoveLeft />
            Back
          </Link>
          <Card className="w-full border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Verify Email</CardTitle>
              <CardDescription className="text-lg">
                Enter the 6-digit code sent to your email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...otpForm}>
                <form
                  onSubmit={otpForm.handleSubmit(verifyCode)}
                  className="flex flex-col items-center space-y-4"
                >
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter OTP</FormLabel>
                        <FormControl>
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                          <FormMessage />
                        </FormControl>
                        <FormDescription>
                          Enter the 6-digit code sent to your email.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <CardAction>
                      <Button type="submit" variant="default">
                        Verify
                      </Button>
                    </CardAction>
                    <CardAction>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => resentOTP()}
                      >
                        Resend Code
                      </Button>
                    </CardAction>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background h-screen grid place-items-center">
      <div className="max-w-xl w-full p-4">
        <Link to="/" className="flex gap-2 mb-2 hover:underline">
          <MoveLeft />
          Back
        </Link>
        <Card className="w-full border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription className="text-lg">
              Register for your notespal account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...signupForm}>
              <form
                onSubmit={signupForm.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
                  <FormField
                    control={signupForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Jane"
                            className="border-border"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Doe"
                            className="border-border"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="janedoe@example.com"
                          className="border-border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="border-border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="border-border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-border"
                        />
                      </FormControl>
                      <FormLabel>
                        Accept the
                        <Link
                          to="/terms-and-conditions"
                          target="_blank"
                          className="font-semibold hover:underline"
                        >
                          Terms and Conditions
                        </Link>
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <div className="flex flex-col w-full space-y-2">
                  <Button
                    type="submit"
                    disabled={
                      !isLoaded ||
                      !signupForm.formState.isValid ||
                      signupForm.formState.isSubmitting
                    }
                    className="w-full"
                  >
                    <LogInIcon />
                    Sign Up
                  </Button>
                  <p className="text-muted-foreground text-center">
                    Already have an account?{" "}
                    <Link
                      to="/auth/sign-in"
                      className="font-semibold hover:underline"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
