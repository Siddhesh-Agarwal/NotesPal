import { useSignUp } from "@clerk/tanstack-react-start";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LogInIcon, MoveLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod/v4";
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
import { metadata } from "@/data";
import { otpFormSchema, signupFormSchema } from "@/schema";

export const Route = createFileRoute("/auth/sign-up")({
  component: RouteComponent,
});

type SignupFormSchema = z.infer<typeof signupFormSchema>;
type OtpFormSchema = z.infer<typeof otpFormSchema>;

function RouteComponent() {
  const signupForm = useForm<SignupFormSchema>({
    resolver: zodResolver(signupFormSchema),
  });
  const otpForm = useForm<OtpFormSchema>({
    resolver: zodResolver(otpFormSchema),
  });
  const { isLoaded, signUp, setActive } = useSignUp();
  const [verifying, setVerifying] = useState(false);

  async function onSubmitSignUpForm(data: SignupFormSchema) {
    if (data.password !== data.confirmPassword) {
      signupForm.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    if (!isLoaded) return;

    try {
      const signUpResult = await signUp.create({
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.email,
        password: data.password,
        legalAccepted: data.termsAccepted,
      });

      if (signUpResult.status === "complete") {
        if (!signUpResult.createdUserId) {
          toast.error("User ID not found");
          return;
        }
        await setActive({ session: signUp.createdSessionId });
      } else {
        await signUpResult.prepareEmailAddressVerification({
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

  async function onSubmitVerifyCodeForm(values: OtpFormSchema) {
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
        await setActive({ session: signUp.createdSessionId });
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

  async function resentOTP() {
    if (!signUp) return;

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      toast.success("Code resent");
    } catch {
      toast.error("Failed to resend code");
    }
  }

  return (
    <div className="bg-background h-screen grid place-items-center">
      <div className="max-w-xl w-full p-4">
        <Link to="/" className="flex gap-2 mb-2 hover:underline">
          <MoveLeft />
          Back
        </Link>
        {verifying ? (
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
                  onSubmit={otpForm.handleSubmit(onSubmitVerifyCodeForm)}
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
                              <InputOTPSlot
                                index={0}
                                className="border-border"
                              />
                              <InputOTPSlot
                                index={1}
                                className="border-border"
                              />
                              <InputOTPSlot
                                index={2}
                                className="border-border"
                              />
                              <InputOTPSlot
                                index={3}
                                className="border-border"
                              />
                              <InputOTPSlot
                                index={4}
                                className="border-border"
                              />
                              <InputOTPSlot
                                index={5}
                                className="border-border"
                              />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          Enter the 6-digit code sent to your email.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <CardAction>
                      <Button
                        type="submit"
                        variant="default"
                        disabled={
                          !isLoaded ||
                          otpForm.formState.isSubmitting ||
                          !otpForm.formState.isValid
                        }
                      >
                        Verify
                      </Button>
                    </CardAction>
                    <CardAction>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => resentOTP()}
                        disabled={!isLoaded || otpForm.formState.isSubmitting}
                      >
                        Resend Code
                      </Button>
                    </CardAction>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Sign Up</CardTitle>
              <CardDescription className="text-lg">
                Register for your {metadata.title} account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...signupForm}>
                <form
                  onSubmit={signupForm.handleSubmit(onSubmitSignUpForm)}
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
                            autoComplete="email"
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
                            autoComplete="new-password"
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
                            autoComplete="new-password"
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

                  {/* Clerk's CAPTCHA widget */}
                  {/** biome-ignore lint/correctness/useUniqueElementIds: <https://clerk.com/docs/guides/development/custom-flows/authentication/bot-sign-up-protection> */}
                  <div
                    id="clerk-captcha"
                    data-cl-theme="light"
                    data-cl-size="flexible"
                  />

                  <div className="flex flex-col w-full space-y-2">
                    <Button
                      type="submit"
                      disabled={
                        !isLoaded ||
                        signupForm.formState.isSubmitting ||
                        !signupForm.formState.isValid
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
        )}
      </div>
    </div>
  );
}
